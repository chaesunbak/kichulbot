import { NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_OPTIONS } from "./auth";
import type { AuthUser } from "./auth";

export interface AuthResponse {
  data: { user: AuthUser; accessToken: string };
}

export function authSuccessResponse(user: AuthUser, accessToken: string) {
  const response = NextResponse.json({ user, accessToken });
  response.cookies.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
  return response;
}

export function authErrorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}
