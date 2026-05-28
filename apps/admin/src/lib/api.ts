import type { AuthResponse, UserResponse } from "@kichulbot/api-contract/auth";
import type { AdminPaperResponse } from "@kichulbot/api-contract/papers";
import type { TaxonomyResponse } from "@kichulbot/api-contract/taxonomy";

export type User = UserResponse;
export type AuthPayload = AuthResponse;
export type Taxonomy = TaxonomyResponse;
export type Paper = AdminPaperResponse;

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        message: string | string[];
      };
    };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

interface ApiRequestOptions {
  method?: "GET" | "POST";
  token?: string;
  body?: unknown;
}

export async function apiRequest<T>(
  path: string,
  parseData: (data: unknown) => T,
  options: ApiRequestOptions = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !envelope.success) {
    let message = "요청 처리 중 오류가 발생했습니다.";

    if (!envelope.success) {
      message = Array.isArray(envelope.error.message)
        ? envelope.error.message.join("\n")
        : envelope.error.message;
    }

    throw new Error(message);
  }

  return parseData(envelope.data);
}
