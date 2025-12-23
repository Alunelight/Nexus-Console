/**
 * 自定义 Fetch 客户端
 * 用于 Orval 生成的 API 调用
 */

export type ErrorType<Error> = Error;

interface CustomFetchConfig extends RequestInit {
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
}

export const customFetch = async <T>(
  config: CustomFetchConfig
): Promise<T> => {
  const { url, data, params, ...rest } = config;

  // 构建 URL（处理查询参数）
  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl = `${url}?${queryString}`;
    }
  }

  const response = await fetch(finalUrl, {
    ...rest,
    body: data ? JSON.stringify(data) : rest.body,
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
