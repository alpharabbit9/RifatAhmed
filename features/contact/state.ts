/**
 * Shared shape for the contact form's `useActionState` cycle.
 *
 * Lives outside `contact.ts` because a "use server" module may only export
 * async functions — the initial-state constant would be rejected there.
 */

export type ContactField = "name" | "email" | "message";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  /** Form-level feedback, shown above the submit button. */
  message: string;
  fieldErrors: Partial<Record<ContactField, string>>;
  /**
   * Bumped on every successful submit so the client can reset the form and
   * re-trigger the success animation even on back-to-back sends.
   */
  submissionId: number;
};

export const CONTACT_INITIAL_STATE: ContactFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  submissionId: 0,
};
