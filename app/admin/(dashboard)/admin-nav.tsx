import { createClient } from "@/lib/supabase/server";
import { AdminNavLinks } from "./admin-nav-links";

/**
 * Server shell for the admin sidebar.
 *
 * Its only job beyond rendering the links is the unread-message count —
 * PLAN.md flags "new messages are only visible by opening /admin/messages"
 * as an open risk, and a badge in the nav is the cheapest mitigation.
 */
export async function AdminNav() {
  const supabase = await createClient();

  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("read", false);

  return <AdminNavLinks unreadCount={count ?? 0} />;
}
