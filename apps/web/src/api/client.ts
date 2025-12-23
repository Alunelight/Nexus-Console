/**
 * 自定义 Fetch 客户端
 * 用于 Orval 生成的 API 调用
 */

export type ErrorType<Error> = Error;

export const customFetch = async <T>(
  config: RequestInit & { url: string }
): Promise<T> => {
  const { url, ...rest } = config;

  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw error;
  }

  return response.json();
};
