import { getAdminContactDetails } from "@/features/contact/data";
import { ContactEditor } from "./contact-editor";

export const dynamic = "force-dynamic";

/**
 * Shown when the contact columns aren't there yet. There is no database
 * connection string locally, so migrations are applied by hand in the Supabase
 * SQL editor — this names the files to run instead of surfacing a raw
 * PostgREST error.
 */
function MigrationNotice({ message }: { message: string }) {
  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Contact</h1>

      <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
        <p className="text-sm text-primary">
          Couldn&apos;t load this section: {message}
        </p>
        <p className="mt-2 text-sm text-foreground-subtle">
          If this is the first run, apply{" "}
          <code className="text-foreground-muted">
            supabase/migrations/0012_profile_contact.sql
          </code>{" "}
          in the Supabase SQL editor — it adds the email, phone, address and
          availability columns to the{" "}
          <code className="text-foreground-muted">profile</code> row. It needs{" "}
          <code className="text-foreground-muted">
            supabase/migrations/0010_profile.sql
          </code>{" "}
          to have been applied first, since that is what creates the table.
          Until then the public site renders the defaults in{" "}
          <code className="text-foreground-muted">features/contact/data.ts</code>
          .
        </p>
      </div>
    </div>
  );
}

export default async function AdminContactPage() {
  const result = await getAdminContactDetails();

  if (!result.ok) {
    return <MigrationNotice message={result.error} />;
  }

  return <ContactEditor contact={result.contact} />;
}
