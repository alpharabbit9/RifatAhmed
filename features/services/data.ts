/**
 * Phase 6 — Services read helpers (server-side).
 *
 * Kept out of `actions.ts` deliberately: everything exported from a
 * "use server" module becomes a callable RPC endpoint, and these are plain
 * reads used by Server Components.
 *
 * Reads degrade the way About, Projects and Career do — until
 * `supabase/migrations/0009_services.sql` has been applied by hand, the public
 * section renders the defaults below instead of a hole. A table that exists
 * but is empty is respected as-is: no rows means the admin cleared it on
 * purpose, and the section hides itself.
 */

import { createClient } from "@/lib/supabase/server";

export type ServicesSection = {
  id: string | null;
  eyebrow: string;
  heading: string;
  standfirst: string;
  /** The closing line beside the CTA. Blank hides it. */
  cta_note: string;
  /** Blank label hides the CTA under the list. */
  cta_label: string;
  cta_href: string;
};

export type Service = {
  id: string;
  title: string;
  summary: string;
  /** Key from `features/services/icons.ts`. */
  icon_name: string;
  deliverables: string[];
  display_order: number;
};

const SERVICE_COLUMNS =
  "id, title, summary, icon_name, deliverables, display_order";

/* -------------------------------------------------------------------------- */
/* Defaults — mirror the seed block of migration 0009                         */
/* -------------------------------------------------------------------------- */

export const DEFAULT_SERVICES_SECTION: ServicesSection = {
  id: null,
  eyebrow: "Services",
  heading: "What I can build for you",
  standfirst:
    "Four ways I usually come into a project — from a product built end to end, to an agent quietly doing the work nobody wants to do twice.",
  cta_note:
    "Not sure which of these your project needs? Describe it and I will tell you.",
  cta_label: "Start a project",
  cta_href: "#contact",
};

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "default-full-stack",
    title: "Full-Stack Web Development",
    summary:
      "Product-grade web applications built end to end — a considered interface on the front, a schema and API that hold up behind it.",
    icon_name: "code",
    deliverables: [
      "Next.js + TypeScript front end, built against a real design system",
      "Postgres schema, auth and row-level security",
      "Typed API routes and server actions",
      "Deployed, monitored and handed over with the keys",
    ],
    display_order: 0,
  },
  {
    id: "default-ai-agents",
    title: "AI Agents & Chatbots",
    summary:
      "Agents that do the job rather than demo it — grounded in your own data, wired to your own tools, and honest about what they do not know.",
    icon_name: "bot",
    deliverables: [
      "RAG pipelines over your documents and databases",
      "Tool-calling agents with MCP integrations",
      "Conversational interfaces with streaming responses",
      "Evaluation and guardrails before anything ships",
    ],
    display_order: 1,
  },
  {
    id: "default-automation",
    title: "Workflow Automation",
    summary:
      "The repetitive half of a business, handed to software — the work still happens, nobody has to do it by hand twice.",
    icon_name: "workflow",
    deliverables: [
      "Multi-step automations across the tools you already pay for",
      "Scheduled jobs, webhooks and event-driven triggers",
      "Document, email and data-entry pipelines",
      "Dashboards so you can see it running",
    ],
    display_order: 2,
  },
  {
    id: "default-backend",
    title: "Backend & API Engineering",
    summary:
      "The part nobody sees until it breaks: data models, integrations and services designed to stay boring under load.",
    icon_name: "server",
    deliverables: [
      "REST and streaming APIs with typed contracts",
      "Database design, migrations and query tuning",
      "Third-party and payment integrations",
      "Background jobs, queues and caching",
    ],
    display_order: 3,
  },
];

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) =>
    typeof entry === "string" && entry.trim() ? [entry.trim()] : [],
  );
}

function normaliseService(row: Record<string, unknown>): Service {
  return {
    id: String(row.id),
    title: typeof row.title === "string" ? row.title : "",
    summary: typeof row.summary === "string" ? row.summary : "",
    icon_name:
      typeof row.icon_name === "string" && row.icon_name
        ? row.icon_name
        : "sparkles",
    deliverables: cleanList(row.deliverables),
    display_order:
      typeof row.display_order === "number" ? row.display_order : 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Public reads                                                               */
/* -------------------------------------------------------------------------- */

export async function getServicesSection(): Promise<ServicesSection> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services_section")
    .select("id, eyebrow, heading, standfirst, cta_note, cta_label, cta_href")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[services] section read failed:", error.message);
    }
    return DEFAULT_SERVICES_SECTION;
  }

  // Individually blank columns fall back too — an empty heading would
  // otherwise render as a hole in the layout. `standfirst` and `cta_label` are
  // the exceptions: blank there means "hide it", which is a real choice.
  return {
    id: data.id,
    eyebrow: data.eyebrow?.trim() || DEFAULT_SERVICES_SECTION.eyebrow,
    heading: data.heading?.trim() || DEFAULT_SERVICES_SECTION.heading,
    standfirst: data.standfirst ?? "",
    cta_note: data.cta_note ?? "",
    cta_label: data.cta_label ?? "",
    cta_href:
      data.cta_href?.trim() || DEFAULT_SERVICES_SECTION.cta_href,
  };
}

export async function getServices(): Promise<Service[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[services] read failed:", error.message);
    return DEFAULT_SERVICES;
  }

  return (data ?? []).map((row) =>
    normaliseService(row as Record<string, unknown>),
  );
}

/* -------------------------------------------------------------------------- */
/* Admin read                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The admin screen must NOT fall back: editing seeded placeholder content that
 * doesn't exist in the database would silently do nothing. A failure here is
 * surfaced as "apply the migration" instead.
 */
export async function getAdminServices(): Promise<
  | { ok: true; section: ServicesSection; services: Service[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient();

  const [sectionResult, servicesResult] = await Promise.all([
    supabase
      .from("services_section")
      .select("id, eyebrow, heading, standfirst, cta_note, cta_label, cta_href")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("services")
      .select(SERVICE_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const failure = sectionResult.error ?? servicesResult.error;
  if (failure) {
    return { ok: false, error: failure.message };
  }

  return {
    ok: true,
    // No row yet (migration applied without the seed) — pre-fill the form with
    // the same defaults the public site falls back to, so saving adopts them.
    section: sectionResult.data
      ? (sectionResult.data as ServicesSection)
      : DEFAULT_SERVICES_SECTION,
    services: (servicesResult.data ?? []).map((row) =>
      normaliseService(row as Record<string, unknown>),
    ),
  };
}
