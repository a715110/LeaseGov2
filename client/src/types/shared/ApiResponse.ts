/**
 * Standard API response envelope.
 */
export type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; errorCode: string; message: string; requestId: string }
