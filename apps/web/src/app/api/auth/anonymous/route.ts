import { api, ApiError } from "@/lib/api";
import {
  AuthResponse,
  authSuccessResponse,
  authErrorResponse,
} from "@/lib/route-helpers";

export async function POST() {
  try {
    const res = await api.post<AuthResponse>("/auth/anonymous", {});
    return authSuccessResponse(res.data.user, res.data.accessToken);
  } catch (err) {
    if (err instanceof ApiError) {
      return authErrorResponse(err.status, err.message);
    }
    return authErrorResponse(500, "Internal server error");
  }
}
