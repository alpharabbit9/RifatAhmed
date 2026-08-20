import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { AdminNav } from "./admin-nav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: middleware already gates /admin/*, but Server
  // Components should never trust that alone.
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="font-display text-lg text-foreground">Admin</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground-subtle">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex flex-col lg:flex-row lg:items-start">
        <AdminNav />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
