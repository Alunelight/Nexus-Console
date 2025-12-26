import { getErrorCode, getErrorMessage, isApiError } from "@/types/errors";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * 错误处理 Hook
 * 提供统一的错误处理逻辑，包括 Toast 通知
 */
export function useErrorHandler() {
  const handleError = useCallback(
    (
      error: unknown,
      options?: { showToast?: boolean; defaultMessage?: string }
    ) => {
      const { showToast = true, defaultMessage } = options || {};

      let message: string;
      let errorCode: string | undefined;

      if (isApiError(error)) {
        message = getErrorMessage(error);
        errorCode = getErrorCode(error);

        // 根据错误码提供更友好的消息
        switch (errorCode) {
          case "INVALID_CREDENTIALS":
            message = "邮箱或密码错误";
            break;
          case "EMAIL_ALREADY_EXISTS":
            message = "该邮箱已被注册";
            break;
          case "USER_NOT_FOUND":
            message = "用户不存在";
            break;
          case "PERMISSION_DENIED":
            message = "权限不足";
            break;
          case "TOKEN_ERROR":
            message = "登录已过期，请重新登录";
            break;
          case "VALIDATION_ERROR":
            // 保持原始验证错误消息
            break;
          default:
            // 使用默认消息或原始消息
            if (defaultMessage) {
              message = defaultMessage;
            }
        }
      } else {
        message = defaultMessage || getErrorMessage(error);
      }

      if (showToast) {
        // 根据状态码选择不同的 Toast 类型
        if (isApiError(error)) {
          if (error.status_code >= 500) {
            toast.error(message, {
              description: "服务器错误，请稍后重试",
            });
          } else if (error.status_code === 401) {
            toast.error(message, {
              description: "请重新登录",
            });
          } else if (error.status_code === 403) {
            toast.error(message, {
              description: "您没有权限执行此操作",
            });
          } else {
            toast.error(message);
          }
        } else {
          toast.error(message);
        }
      }

      return {
        message,
        errorCode,
        isApiError: isApiError(error),
        originalError: error,
      };
    },
    []
  );

  return { handleError };
}
