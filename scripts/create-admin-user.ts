/**
 * One-time provisioning script for the single Supabase admin user.
 * Run with: npm run create-admin
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL,
 * ADMIN_PASSWORD from .env.local. Idempotent — if the user already exists,
 * it reports that instead of erroring.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceRoleKey || !email || !password) {
  console.error(
    "Missing one of NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, " +
      "ADMIN_EMAIL, ADMIN_PASSWORD in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.code === "email_exists" || error.status === 422) {
      console.log(`Admin user ${email} already exists — nothing to do.`);
      return;
    }
    throw error;
  }

  console.log(`Created admin user ${data.user?.email} (${data.user?.id}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
