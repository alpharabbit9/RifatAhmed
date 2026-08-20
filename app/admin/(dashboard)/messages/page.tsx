import { createClient } from "@/lib/supabase/server";
import { MessagesClient, type ContactMessage } from "./messages-client";

// Messages change from outside the app (the public form), so never cache.
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, read, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <p className="label-overline">Contact</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Messages</h1>
        <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
          <p className="text-sm text-primary">
            Couldn&apos;t load messages: {error.message}
          </p>
          <p className="mt-2 text-sm text-foreground-subtle">
            If this is the first run, apply{" "}
            <code className="text-foreground-muted">
              supabase/migrations/0007_contact_messages.sql
            </code>{" "}
            in the Supabase SQL editor.
          </p>
        </div>
      </div>
    );
  }

  return <MessagesClient messages={(data ?? []) as ContactMessage[]} />;
}
