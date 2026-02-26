import { API_PATHS } from "@/lib/constants";

/**
 * Get download URL for an attachment (use in <a href> or window.open).
 * Backend serves file from /api/v1/attachments/download/:filename
 */
export function getAttachmentDownloadUrl(filename) {
  const base = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1") : "http://localhost:4001/api/v1";
  return `${base}${API_PATHS.ATTACHMENTS.DOWNLOAD(filename)}`;
}

/** Download file by filename (optional: pass token for protected uploads) */
export const attachmentService = {
  getDownloadUrl: getAttachmentDownloadUrl,
};
