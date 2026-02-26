/**
 * Central export for all API services. Use env NEXT_PUBLIC_API_URL for base URL.
 */
export { authService } from "./authService";
export { userService } from "./userService";
export { collectionService } from "./collectionService";
export { productService } from "./productService";
export { orderService } from "./orderService";
export { designService } from "./designService";
export { attachmentService, getAttachmentDownloadUrl } from "./attachmentService";
export { feedbackService } from "./feedbackService";
export { customerBriefService } from "./customerBriefService";
