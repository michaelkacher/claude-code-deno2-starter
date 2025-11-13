/**
 * Centralized error codes and message helpers for Approval feature.
 * Enables consistent assertions in tests and easier i18n/logging later.
 */

export const ERR = {
  APPROVAL_DUPLICATE_TASK: (taskId: string) => `Approval request already exists for task ${taskId}`,
  APPROVAL_ORIGINAL_REQ_REQUIRED: 'Original requirements are required',
  APPROVAL_AI_REQ_REQUIRED: 'AI-generated requirements are required',
  APPROVAL_ASSIGNED_REVIEWER_REQUIRED: 'Assigned reviewer is required',
  APPROVAL_NOT_FOUND: 'Approval request not found',
  APPROVAL_UNAUTHORIZED_REVIEWER: 'Only assigned reviewer',
  APPROVAL_ALREADY_DECIDED: 'Decision already submitted',
  APPROVAL_FEEDBACK_REQUIRED: (decision?: string) => decision ? `Feedback is required for ${decision} decisions` : 'Feedback is required',
  APPROVAL_CREATOR_ONLY_REASSIGN: 'Only task creator',
  APPROVAL_UPDATE_FAILED: 'Failed to update approval'
} as const;

export type ErrorCode = keyof typeof ERR;

/**
 * Build an Error with a stable code property that tools can inspect.
 */
export function buildError(code: ErrorCode, ...args: unknown[]): Error {
  const template = ERR[code];
  const message = typeof template === 'function' ? (template as any)(...args) : template;
  const err = new Error(message);
  (err as any).code = code;
  return err;
}
