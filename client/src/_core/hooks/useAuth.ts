import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import type { User } from "@shared/types";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("auth-user-info");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User | null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const cachedUser = useMemo(() => readCachedUser(), [meQuery.data]);
  const resolvedUser = meQuery.data ?? ((meQuery.isLoading || meQuery.isFetching) ? cachedUser : null);

  const state = useMemo(() => {
    return {
      user: resolvedUser,
      loading: ((!resolvedUser && (meQuery.isLoading || meQuery.isFetching)) || logoutMutation.isPending),
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(resolvedUser),
    };
  }, [
    meQuery.error,
    meQuery.isFetching,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    resolvedUser,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("auth-user-info", JSON.stringify(resolvedUser ?? null));
    } catch {
      // Ignore storage failures so auth state never crashes the UI.
    }
  }, [resolvedUser]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || meQuery.isFetching || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isFetching,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
