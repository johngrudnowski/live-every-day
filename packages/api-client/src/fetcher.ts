type Primitive = string | number | boolean;
type QueryValue = Primitive | Primitive[] | undefined | null;
type QueryParams = Record<string, QueryValue>;

type CustomFetchOptions<TBody = unknown> = RequestInit & {
  data?: TBody;
  params?: QueryParams;
};

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function resolveApiBaseUrl() {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const viteApiUrl = viteEnv?.VITE_API_URL;
  if (viteApiUrl) {
    return stripTrailingSlash(viteApiUrl);
  }

  const processEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const nodeApiUrl = processEnv?.EXPO_PUBLIC_API_URL ?? processEnv?.VITE_API_URL ?? processEnv?.API_URL;
  if (nodeApiUrl) {
    return stripTrailingSlash(nodeApiUrl);
  }

  return '';
}

function appendQueryParams(url: string, params?: QueryParams) {
  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  if (!query) {
    return url;
  }

  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
}

function buildUrl(url: string, params?: QueryParams) {
  const baseUrl = resolveApiBaseUrl();
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  const resolvedUrl = /^https?:\/\//.test(url) || !baseUrl ? url : `${baseUrl}${normalizedPath}`;

  return appendQueryParams(resolvedUrl, params);
}

export async function customFetch<TResponse, TBody = unknown>(
  url: string,
  {
    data,
    params,
    body,
    ...init
  }: CustomFetchOptions<TBody> = {},
): Promise<TResponse> {
  const response = await fetch(buildUrl(url, params), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    credentials: 'include',
    body: data === undefined ? body : JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}.`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const responseBody = async () => {
    if (response.status === 204) {
      return undefined;
    }

    if (contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  };

  const dataValue = await responseBody();
  return {
    data: dataValue,
    status: response.status,
    headers: response.headers,
  } as TResponse;
}
