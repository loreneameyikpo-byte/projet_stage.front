import { $fetch } from "ofetch";
import { useRuntimeConfig, useCookie } from "#imports";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit | Record<string, any> | null;
  headers?: Record<string, string>;
  query?: Record<string, any>;
};

export async function ensureCsrfCookie(): Promise<void> {
  return Promise.resolve();
}

export function useApi() {
  const config = useRuntimeConfig();
  const tokenCookie = useCookie("auth_token");

  const apiBaseUrl = (config.public.apiBaseUrl as string | undefined) ?? "http://localhost:8000";

  async function apiFetch<T = unknown>(
    url: string,
    options: ApiFetchOptions = {},
  ): Promise<T> {
    const isClient = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
    const localToken = isClient ? localStorage.getItem("auth_token") : null;
    const token = tokenCookie.value ?? localToken;

    const isFormData = options.body instanceof FormData;

    return $fetch<T>(url, {
      baseURL: apiBaseUrl,
      ...options,
      query: options.query as Record<string, any> | undefined,
      headers: {
        Accept: "application/json",
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  }

  return { apiFetch };
}