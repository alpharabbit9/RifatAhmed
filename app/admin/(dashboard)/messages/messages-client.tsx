"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCheck,
  ChevronDown,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Reply,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteMessage,
  markAllMessagesRead,
  setMessageRead,
} from "@/features/contact/actions";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
};

type Filter = "all" | "unread";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/* -------------------------------------------------------------------------- */
/* Single message row                                                         */
/* -------------------------------------------------------------------------- */

function MessageRow({
  message,
  expanded,
  onToggle,
  onError,
}: {
  message: ContactMessage;
  expanded: boolean;
  onToggle: () => void;
  onError: (error: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.error) {
        onError(result.error);
        return;
      }
      router.refresh();
    });
  }

  // Opening an unread message marks it read — the expected inbox behaviour.
  function handleToggle() {
    onToggle();
    if (!expanded && !message.read) {
      run(() => setMessageRead(message.id, true));
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "overflow-hidden rounded-[14px] border bg-surface transition-colors",
        message.read ? "border-border" : "border-primary/45",
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-4 p-5 text-left ring-brand"
      >
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            message.read ? "bg-border-light" : "bg-primary",
          )}
          aria-hidden
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                "text-[15px] text-foreground",
                message.read ? "font-medium" : "font-semibold",
              )}
            >
              {message.name}
            </span>
            <span className="text-[13px] text-foreground-subtle">
              {message.email}
            </span>
          </span>

          <span
            className={cn(
              "mt-1.5 block text-[14px] leading-[1.6] text-foreground-muted",
              !expanded && "line-clamp-1",
            )}
          >
            {expanded ? "" : message.message}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3">
          <span className="hidden text-[12px] text-foreground-subtle sm:block">
            {dateFormatter.format(new Date(message.created_at))}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-foreground-subtle transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pb-5 pt-4">
              <p className="whitespace-pre-wrap text-[14px] leading-[1.7] text-foreground-muted">
                {message.message}
              </p>

              <p className="mt-4 text-[12px] text-foreground-subtle sm:hidden">
                {dateFormatter.format(new Date(message.created_at))}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:${message.email}?subject=${encodeURIComponent(
                    `Re: your message`,
                  )}`}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </a>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => setMessageRead(message.id, !message.read))}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border-light px-4 text-[13px] font-medium text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground disabled:opacity-50"
                >
                  {message.read ? (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      Mark unread
                    </>
                  ) : (
                    <>
                      <MailOpen className="h-3.5 w-3.5" />
                      Mark read
                    </>
                  )}
                </button>

                {confirmingDelete ? (
                  <span className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run(() => deleteMessage(message.id))}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="h-9 px-2 text-[13px] text-foreground-subtle transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-border-light px-4 text-[13px] font-medium text-foreground-subtle transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function MessagesClient({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const unreadCount = messages.filter((message) => !message.read).length;
  const visible =
    filter === "unread" ? messages.filter((m) => !m.read) : messages;

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllMessagesRead();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-overline">Contact</p>
          <h1 className="mt-2 font-display text-3xl text-foreground">
            Messages
          </h1>
          <p className="mt-2 text-sm text-foreground-subtle">
            {messages.length} total
            {unreadCount > 0 && ` · ${unreadCount} unread`}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border-light px-4 text-[13px] font-medium text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {(["all", "unread"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "relative px-4 pb-3 pt-2 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors",
              filter === value
                ? "text-foreground"
                : "text-foreground-subtle hover:text-foreground-muted",
            )}
          >
            {value === "all" ? "All" : `Unread (${unreadCount})`}
            {filter === value && (
              <motion.span
                layoutId="messages-filter-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-primary" role="alert">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-[18px] border border-dashed border-border py-16 text-center">
          <Inbox className="h-7 w-7 text-foreground-subtle" />
          <p className="mt-4 font-display text-xl text-foreground">
            {filter === "unread" ? "Nothing unread" : "No messages yet"}
          </p>
          <p className="mt-2 max-w-xs text-sm text-foreground-subtle">
            {filter === "unread"
              ? "You're all caught up."
              : "Submissions from the site's contact form will land here."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {visible.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                expanded={expandedId === message.id}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === message.id ? null : message.id,
                  )
                }
                onError={setError}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
