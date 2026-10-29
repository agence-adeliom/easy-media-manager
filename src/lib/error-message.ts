import { EasyMediaApiError } from "@/api/http";

/**
 * Message shown for a failed action: the backend's own message, or one written by the library, otherwise the
 * translated `ajax_error` (never "HTTP 500", "Failed to fetch" or a JavaScript error).
 */
export function getErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof EasyMediaApiError) {
    return error.fromServer ? error.message : t("ajax_error");
  }

  // A plain `Error` is thrown by the library itself, with a backend or translated message.
  if (error instanceof Error && error.name === "Error" && error.message) {
    return error.message;
  }

  return t("ajax_error");
}
