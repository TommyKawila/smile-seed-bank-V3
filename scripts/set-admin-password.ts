import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

async function findUserIdByEmail(
  admin: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServiceRoleClient>>,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data?.users?.find((u) => u.email?.toLowerCase() === normalized);
    if (hit) return hit.id;
    if (!data?.users?.length || data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

async function main() {
  const email = process.env.ADMIN_SET_PASSWORD_EMAIL?.trim();
  const password = process.env.ADMIN_SET_PASSWORD_NEW?.trim();
  if (!email || !password) {
    console.error(
      "Set ADMIN_SET_PASSWORD_EMAIL and ADMIN_SET_PASSWORD_NEW in .env.local (or env), then run: npm run admin:set-password"
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters (Supabase default).");
    process.exit(1);
  }

  const { createServiceRoleClient } = await import("@/lib/supabase/server");
  const admin = createServiceRoleClient();
  const id = await findUserIdByEmail(admin, email);
  if (!id) {
    console.error(`No auth user found for email: ${email}`);
    process.exit(1);
  }

  const { data: existing, error: getErr } = await admin.auth.admin.getUserById(id);
  if (getErr || !existing?.user) {
    console.error(getErr?.message ?? "getUserById failed");
    process.exit(1);
  }
  const meta = { ...(existing.user.user_metadata as Record<string, unknown>), role: "ADMIN" };
  const { error } = await admin.auth.admin.updateUserById(id, {
    password,
    user_metadata: meta,
  });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log(`Updated password for ${email} (ADMIN role in user_metadata).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
