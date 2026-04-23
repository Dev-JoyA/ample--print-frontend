import { API_PATHS } from '@/lib/constants';

export function getAttachmentDownloadUrl(filename) {
  const base =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1'
      : 'http://localhost:4001/api/v1';
  return `${base}${API_PATHS.ATTACHMENTS.DOWNLOAD(filename)}`;
}

export const attachmentService = {
  getDownloadUrl: getAttachmentDownloadUrl,
};
