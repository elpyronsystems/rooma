import type { ApiIssue } from "./types";

/**
 * Thrown whenever the backend responds with a non-2xx status.
 * Carries the human-readable message the backend sent, plus any
 * field-level validation issues (from the Zod validation middleware),
 * so the UI can show specific, useful errors instead of a generic one.
 */
export class ApiError extends Error {
  statusCode: number;
  issues?: ApiIssue[];

  constructor(statusCode: number, message: string, issues?: ApiIssue[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.issues = issues;
  }
}
