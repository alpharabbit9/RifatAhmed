/**
 * Sample / fallback project data.
 *
 * One real project (CareerLogic AI) followed by three clearly-marked
 * placeholders — the placeholders are what give the `<Stack />` in
 * `projects-content.tsx` a pile to shuffle, and they keep the card honest
 * about the shapes it has to survive: no live demo, a four-feature grid, a
 * long description. `supabase/migrations/0004_projects_demo_seed.sql` inserts
 * the same three, so the section looks the same with or without a database.
 *
 * Written as **case studies** (`SAMPLE_CASE_STUDIES`), because that is the
 * larger shape: `SAMPLE_PROJECTS` — what the home-page card renders — is
 * derived from it below. One source of truth, so a project can never say one
 * thing on the card and another on `/projects/<slug>`.
 *
 * Three jobs:
 *   1. It is what the public Projects section and the case-study page render
 *      before `supabase/migrations/0004_projects.sql` +
 *      `0005_project_case_study.sql` have been applied by hand (same pattern
 *      as `features/about/data.ts` — the site never renders a hole).
 *   2. It documents the exact shapes `<ProjectShowcaseCard>` and
 *      `<ProjectCaseStudy>` expect, so either can be dropped anywhere with a
 *      literal object and no database.
 *   3. It is the copy the migrations seed, so the first admin edit starts from
 *      something real rather than an empty form.
 *
 * A table that exists but is *empty* is respected as-is: that means the admin
 * deleted the rows on purpose, so the section hides itself instead of
 * resurrecting CareerLogic AI.
 *
 * Feature and highlight icons are written as keys from `./icons.ts` rather
 * than imported Lucide components: this module is read by a Server Component,
 * and function references can't cross the RSC boundary. Inside a Client
 * Component both shapes also accept the component itself (`icon: BrainCircuit`).
 *
 * Screenshots stay empty here — they are uploaded through /admin/projects, and
 * both the card and the case-study hero fall back to a burgundy placeholder
 * frame rather than a broken image.
 */

import { projectHref } from "@/features/projects/constants";
import type {
  CaseStudyProject,
  ShowcaseProject,
} from "@/features/projects/types";

export const SAMPLE_CASE_STUDIES: CaseStudyProject[] = [
  {
    slug: "careerlogic-ai",
    title: "CareerLogic AI",
    subtitle: "AI-Powered Resume Builder",
    category: "Featured Project",
    description:
      "An AI powered platform that analyzes, tailors and optimizes resumes to help users land their dream jobs faster with intelligent insights and custom suggestions.",
    year: "2025",
    role: "Full Stack Developer",
    liveDemo: "https://careerlogicai.vercel.app",
    sourceCode: "https://github.com/alpharabbit9/careerlogic-ai",
    gallery: [],
    about: [
      "CareerLogic AI helps job seekers create ATS-friendly resumes that are optimized for specific roles. The platform leverages AI to analyze resumes, provide smart suggestions, match keywords, and tailor content that gets you noticed.",
      "Built with a modern tech stack and a focus on performance, privacy and user experience — every resume is processed in seconds and never leaves your account.",
    ],
    features: [
      {
        icon: "brain",
        title: "AI Resume Analysis",
        description: "Get detailed scoring and feedback on your resume.",
      },
      {
        icon: "sparkles",
        title: "Smart Tailoring",
        description: "Tailor your resume for any job description instantly.",
      },
      {
        icon: "target",
        title: "ATS Optimization",
        description: "Increase your chances with ATS-friendly content.",
      },
      {
        icon: "download",
        title: "Easy Export",
        description: "Export your resume in PDF with one click.",
      },
    ],
    techStack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Shadcn/ui",
      "Node.js",
      "Express.js",
      "MongoDB",
      "Groq API",
      "Zustand",
      "Framer Motion",
      "Vercel",
    ],
    highlights: [
      { icon: "users", value: "3K+", label: "Users" },
      { icon: "chart", value: "95%", label: "Satisfaction" },
      { icon: "zap", value: "2.3s", label: "Avg. Load Time" },
    ],
    challenge:
      "Many job seekers struggle to create resumes that pass ATS scanners and highlight the right skills. We needed an intelligent system that understands job requirements and delivers customized, high-impact resumes.",
    solution:
      "We combined AI-powered insights with a clean, intuitive interface to help users optimize their resumes effectively. Real-time scoring, keyword matching and smart suggestions make the process fast and effortless.",
    impact:
      "Users get higher resume scores, better interview calls and more confidence in their applications. The platform simplifies the entire resume building process with AI.",
  },

  /* ---------------------------------------------------------------------- */
  /* Placeholders                                                           */
  /*                                                                        */
  /* The three below are *not* real work — they exist so the card stack has  */
  /* a pile to be a pile of, and so both the card and the case-study page    */
  /* are exercised against a second category, more features than the card    */
  /* shows, a project with no live demo, and one with no highlights at all.  */
  /* Replace them (here and in 0004_projects_demo_seed.sql) as real projects */
  /* ship.                                                                  */
  /* ---------------------------------------------------------------------- */

  {
    slug: "insight-desk",
    title: "Insight Desk",
    subtitle: "AI Support Agent",
    category: "AI Agent",
    description:
      "A support agent that reads the ticket, pulls the matching docs and drafts a reply for a human to approve — with every answer traced back to the page it came from.",
    year: "2025",
    role: "Full Stack Developer",
    liveDemo: undefined,
    sourceCode: undefined,
    gallery: [],
    about: [
      "Insight Desk sits in front of a support inbox: it classifies the incoming ticket, retrieves the passages that answer it, and writes a draft reply the agent can send, edit or reject.",
      "Nothing goes out unreviewed. Every draft cites the document it leaned on, so the agent approving it can check the claim in one click.",
    ],
    features: [
      {
        icon: "bot",
        title: "Auto Triage",
        description: "Sorts and routes each ticket the moment it arrives.",
      },
      {
        icon: "message",
        title: "Draft Replies",
        description: "A human approves every answer before it sends.",
      },
      {
        icon: "chart",
        title: "Deflection Stats",
        description: "Tracks exactly what the agent saved the team.",
      },
    ],
    techStack: [
      "Next.js",
      "TypeScript",
      "LangChain",
      "Supabase",
      "Tailwind CSS",
    ],
    highlights: [
      { icon: "message", value: "1.2K", label: "Tickets / mo" },
      { icon: "zap", value: "40%", label: "Deflected" },
    ],
    challenge:
      "Support volume grew faster than the team could hire, and the same handful of questions kept arriving in slightly different words.",
    solution:
      "A retrieval-backed agent drafts the answer from the team's own documentation and hands it to a human, rather than replacing one.",
    impact:
      "Roughly two in five tickets now close on a first-pass draft, and every reply points back at the doc it came from.",
  },

  {
    slug: "flowline",
    title: "Flowline",
    subtitle: "Workflow Automation Studio",
    category: "Automation",
    description:
      "A visual builder for the small, dull jobs between tools — triggers, branches and retries, with a run log that says exactly which step failed and why.",
    year: "2025",
    role: "Backend & Automation",
    liveDemo: undefined,
    sourceCode: undefined,
    gallery: [],
    about: [
      "Flowline turns the recurring jobs between a team's tools into flows anyone can read: a trigger, a few steps, a branch or two, and a log of every run.",
      "The interesting part is the failure path — a step that throws is retried with backoff, and the run stays replayable from the point it broke.",
    ],
    features: [
      {
        icon: "workflow",
        title: "Visual Builder",
        description: "Drag steps into a flow and connect them.",
      },
      {
        icon: "zap",
        title: "Instant Triggers",
        description: "Webhooks, cron schedules or a manual run.",
      },
      {
        icon: "shield",
        title: "Retry & Audit",
        description: "Every run is kept, inspectable and replayable.",
      },
      {
        icon: "network",
        title: "Tool Connectors",
        description: "Sheets, Slack, Stripe and plain HTTP.",
      },
    ],
    techStack: ["n8n", "Node.js", "Express", "PostgreSQL", "React"],
    highlights: [
      { icon: "workflow", value: "60+", label: "Flows Shipped" },
      { icon: "shield", value: "99.4%", label: "Run Success" },
    ],
    challenge:
      "The jobs between tools were spread across cron files and one-off scripts, and a failure was only noticed when someone downstream complained.",
    solution:
      "One studio where a flow is built visually, every run is logged, and a failed step retries itself before it ever needs a person.",
    impact:
      "The manual handoffs disappeared, and a broken run now names the step and the reason instead of going quiet.",
  },

  {
    slug: "doc-atlas",
    title: "Doc Atlas",
    subtitle: "RAG Document Intelligence",
    category: "AI + RAG",
    description:
      "Ask a question across a folder of contracts and specifications and get one answer with citations — chunked, embedded and re-ranked so the source is always a click away.",
    year: "2024",
    role: "AI Engineer",
    liveDemo: undefined,
    sourceCode: undefined,
    gallery: [],
    about: [
      "Doc Atlas indexes a folder of long, dry documents — contracts, specifications, policies — and answers questions across all of them at once.",
      "Answers are assembled from re-ranked passages, and every claim carries the page it came from, so the reader verifies rather than trusts.",
    ],
    features: [
      {
        icon: "search",
        title: "Semantic Search",
        description: "Finds meaning rather than matching keywords.",
      },
      {
        icon: "database",
        title: "Vector Store",
        description: "pgvector with a hybrid re-ranking pass.",
      },
      {
        icon: "file",
        title: "Cited Answers",
        description: "Every claim links back to its source page.",
      },
    ],
    techStack: ["Next.js", "LangChain", "MCP", "Prisma", "PostgreSQL"],
    highlights: [],
    challenge:
      "The answer to a question was usually somewhere in a 200-page PDF, and keyword search only found the pages that happened to use the same words.",
    solution:
      "Chunked embeddings with a re-ranking pass, so the retrieved passages are the ones that answer the question rather than the ones that echo it.",
    impact:
      "Questions that took an afternoon of reading now resolve in a query, with the source page one click away.",
  },
];

/* -------------------------------------------------------------------------- */
/* Derived — what the home-page card renders                                  */
/* -------------------------------------------------------------------------- */

/** Case study → card. The card's own slice keeps the feature row to three. */
function toShowcase(project: CaseStudyProject): ShowcaseProject {
  const showcase = project.gallery[0] ?? null;

  return {
    title: project.title,
    subtitle: project.subtitle,
    category: project.category,
    description: project.description,
    screenshot: showcase?.url ?? null,
    screenshotAlt: showcase?.alt ?? undefined,
    features: project.features,
    technologies: project.techStack,
    year: project.year,
    role: project.role,
    projectUrl: projectHref(project.slug),
    liveDemo: project.liveDemo,
  };
}

export const SAMPLE_PROJECTS: ShowcaseProject[] =
  SAMPLE_CASE_STUDIES.map(toShowcase);

/** The fallback case study for `/projects/<slug>` — `null` for a stray slug. */
export function getSampleCaseStudy(slug: string): CaseStudyProject | null {
  return SAMPLE_CASE_STUDIES.find((project) => project.slug === slug) ?? null;
}
