/**
 * useAuth — Convenience hook for CF Gateway auth state.
 *
 * Exposes user, isAuthenticated, signIn, signOut from the AuthProvider context.
 * Thin wrapper over useAuthContext for ergonomic imports.
 *
 * Requirements: R2 (Authentication via CF Gateway), R10 (onAuthStateChange contract)
 */
import { useAuthContext } from "@/contexts/auth-context";

/**
 * Access the auth state and actions from the AuthProvider.
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, signIn, signOut } = useAuth();
 * ```
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, error, signIn, signOut, accessToken } =
    useAuthContext();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    accessToken,
  };
}
