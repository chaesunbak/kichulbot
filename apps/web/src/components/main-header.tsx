"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@kichulbot/ui/components/button";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthUser } from "@/lib/auth";

interface Props {
  user: AuthUser;
}

export default function MainHeader({ user }: Props) {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    clearAuth();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/papers" className="text-base font-semibold text-zinc-900">
          기출봇
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            {user.nickname ?? user.email ?? "게스트"}
          </span>
          {user.authType === "ANONYMOUS" && (
            <Button asChild variant="outline" size="sm">
              <Link href="/register">계정 만들기</Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
}
