/**
 * API 错误响应类型定义
 * 与后端 ErrorResponse 保持一致
 */
export interface ApiError {
  error: string;
  detail: string | string[] | null;
  status_code: number;
  code?: string; // 错误码，用于程序化处理
}

/**
 * 判断是否为 API 错误
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    "status_code" in error
  );
}

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (typeof error.detail === "string") {
      return error.detail;
    }
    if (Array.isArray(error.detail)) {
      return error.detail.join("; ");
    }
    return error.error || "发生了一个错误";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "发生了一个未知错误";
}

/**
 * 获取错误码（如果可用）
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.code;
  }
  return undefined;
}
