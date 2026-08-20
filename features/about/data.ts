/**
 * Phase 2 — About Me read helpers (server-side).
 *
 * Kept out of `actions.ts` deliberately: everything exported from a
 * "use server" module becomes a callable RPC endpoint, and these are plain
 * reads used by Server Components.
 *
 * Every read falls back to the seeded defaults below when the table isn't
 * there yet, so the public section renders correctly before
 * `supabase/migrations/0002_about_and_skills.sql` has been applied by hand.
 * A table that exists but is *empty* is respected as-is — that means the
 * admin deleted the rows on purpose.
 */

import { createClient } from "@/lib/supabase/server";

export type AboutContent = {
  id: string | null;
  eyebrow: string;
  /** One display line per newline. */
  heading: string;
  /** Paragraphs separated by a blank line; `**bold**` is highlighted. */
  body: string;
  stack_eyebrow: string;
  stack_heading: string;
  stack_body: string;
};

export type EducationEntry = {
  id: string;
  degree: string;
  institution: string;
  timeframe: string | null;
  note: string | null;
  display_order: number;
};

export type Skill = {
  id: string;
  label: string;
  display_order: number;
};

export type SkillGroup = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  icon_name: string;
  display_order: number;
  skills: Skill[];
};

/* -------------------------------------------------------------------------- */
/* Defaults — mirror the seed block of migration 0002                         */
/* -------------------------------------------------------------------------- */

export const DEFAULT_ABOUT: AboutContent = {
  id: null,
  eyebrow: "About Me",
  heading: "Build.\nSolve.\nLearn.",
  body: [
    "I am **Rifat Ahmed**, a CSE student and Full-Stack Developer passionate about building modern web applications and **AI-powered systems**.",
    "I enjoy turning ideas into intuitive, well-designed products using **React, Next.js, Node.js**, and modern technologies. Currently I am exploring **AI Agents, RAG, MCP, machine learning, and workflow automation** to build intelligent solutions for real-world problems.",
  ].join("\n\n"),
  stack_eyebrow: "Tech Stack",
  stack_heading: "What I build with",
  stack_body:
    "Three layers of the same craft — the interface people touch, the systems behind it, and the intelligence wired through both.",
};

export const DEFAULT_EDUCATION: EducationEntry[] = [
  {
    id: "default-education",
    degree: "BSc in Computer Science and Engineering",
    institution: "Leading University",
    timeframe: null,
    note: null,
    display_order: 0,
  },
];

export const DEFAULT_SKILL_GROUPS: SkillGroup[] = [
  {
    id: "default-frontend",
    slug: "frontend",
    title: "Frontend & Interactive Experiences",
    summary:
      "Interfaces that feel fast, considered and alive — design systems through to 3D.",
    icon_name: "layers",
    display_order: 0,
    skills: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Three.js",
      "Zustand",
      "ShadCN UI",
    ].map((label, index) => ({
      id: `default-frontend-${index}`,
      label,
      display_order: index,
    })),
  },
  {
    id: "default-backend",
    slug: "backend",
    title: "Backend & Databases",
    summary: "APIs, schemas and auth built to hold up once real traffic arrives.",
    icon_name: "database",
    display_order: 1,
    skills: [
      "Node.js",
      "Express.js",
      "REST APIs",
      "Prisma",
      "PostgreSQL",
      "MongoDB",
      "Supabase",
    ].map((label, index) => ({
      id: `default-backend-${index}`,
      label,
      display_order: index,
    })),
  },
  {
    id: "default-ai",
    slug: "ai",
    title: "AI & Intelligent Systems",
    summary:
      "Agents, retrieval and automation wired into products that actually ship.",
    icon_name: "sparkles",
    display_order: 2,
    skills: [
      "N8N",
      "AI Agents",
      "RAG",
      "MCP",
      "LangChain",
      "Vector Databases",
    ].map((label, index) => ({
      id: `default-ai-${index}`,
      label,
      display_order: index,
    })),
  },
];

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function getAbout(): Promise<AboutContent> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("about")
    .select(
      "id, eyebrow, heading, body, stack_eyebrow, stack_heading, stack_body",
    )
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[about] read failed:", error.message);
    }
    return DEFAULT_ABOUT;
  }

  // Individually blank columns fall back too — an empty heading would
  // otherwise render as a hole in the layout.
  return {
    id: data.id,
    eyebrow: data.eyebrow?.trim() || DEFAULT_ABOUT.eyebrow,
    heading: data.heading?.trim() || DEFAULT_ABOUT.heading,
    body: data.body?.trim() || DEFAULT_ABOUT.body,
    stack_eyebrow: data.stack_eyebrow?.trim() || DEFAULT_ABOUT.stack_eyebrow,
    stack_heading: data.stack_heading?.trim() || DEFAULT_ABOUT.stack_heading,
    stack_body: data.stack_body ?? "",
  };
}

export async function getEducation(): Promise<EducationEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("education")
    .select("id, degree, institution, timeframe, note, display_order")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[about] education read failed:", error.message);
    return DEFAULT_EDUCATION;
  }

  return data ?? [];
}

export async function getSkillGroups(): Promise<SkillGroup[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("skill_groups")
    .select(
      "id, slug, title, summary, icon_name, display_order, skills(id, label, display_order)",
    )
    .order("display_order", { ascending: true })
    .order("display_order", { referencedTable: "skills", ascending: true });

  if (error) {
    console.error("[about] skill_groups read failed:", error.message);
    return DEFAULT_SKILL_GROUPS;
  }

  return (data ?? []).map((group) => ({
    ...group,
    skills: (group.skills ?? []) as Skill[],
  })) as SkillGroup[];
}
