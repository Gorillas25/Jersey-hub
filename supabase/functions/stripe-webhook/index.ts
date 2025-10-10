import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
};

function generateUsername(name: string): string {
  const cleanName = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  const randomSuffix = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");

  return `${cleanName}${randomSuffix}`;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendCredentialsEmail(
  email: string,
  name: string,
  username: string,
  password: string,
  planName: string
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const response = await fetch(`${supabaseUrl}/functions/v1/send-credentials-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({
        email,
        name,
        username,
        password,
        planName,
      }),
    });

    if (!response.ok) {
      console.error("Error sending email:", await response.text());
    } else {
      console.log("Email sent successfully to:", email);
    }
  } catch (error) {
    console.error("Error calling send-credentials-email function:", error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret");
      return new Response("Missing signature or secret", { status: 400 });
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Webhook event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Checkout session completed:", session.id);
        console.log("Customer email:", session.customer_email);
        console.log("Customer details:", session.customer_details);

        if (!session.customer_email) {
          console.error("No customer email in session");
          break;
        }

        const customerName = session.customer_details?.name || session.customer_email.split("@")[0];
        const username = generateUsername(customerName);
        const password = generatePassword();

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: session.customer_email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: customerName,
            username: username,
          },
        });

        if (authError) {
          console.error("Error creating user:", authError);

          if (authError.message.includes("already registered")) {
            console.log("User already exists, updating subscription...");
            const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
            const user = existingUser.users.find(u => u.email === session.customer_email);

            if (user && session.subscription) {
              const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

              await supabaseAdmin.from("profiles").update({
                subscription_status: "active",
                subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              }).eq("id", user.id);

              console.log("Subscription updated for existing user");
            }
            break;
          }

          throw authError;
        }

        console.log("User created:", authData.user.id);

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          const subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString();

          await supabaseAdmin.from("profiles").update({
            subscription_status: "active",
            subscription_end_date: subscriptionEndDate,
          }).eq("id", authData.user.id);

          console.log("Profile updated with subscription");
        }

        const planName = session.line_items?.data[0]?.description || "JerseyHub";

        await sendCredentialsEmail(
          session.customer_email,
          customerName,
          username,
          password,
          planName
        );

        console.log("Credentials sent successfully");
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);

        if ("deleted" in customer && customer.deleted) {
          console.error("Customer was deleted");
          break;
        }

        const customerEmail = customer.email;
        if (!customerEmail) {
          console.error("No email for customer");
          break;
        }

        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customerEmail);

        if (user) {
          await supabaseAdmin.from("profiles").update({
            subscription_status: subscription.status === "active" ? "active" : "inactive",
            subscription_end_date: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          }).eq("id", user.id);

          console.log("Subscription updated for user:", user.email);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);

        if ("deleted" in customer && customer.deleted) {
          console.error("Customer was deleted");
          break;
        }

        const customerEmail = customer.email;
        if (!customerEmail) {
          console.error("No email for customer");
          break;
        }

        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customerEmail);

        if (user) {
          await supabaseAdmin.from("profiles").update({
            subscription_status: "inactive",
            subscription_end_date: null,
          }).eq("id", user.id);

          console.log("Subscription cancelled for user:", user.email);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
