import { useEffect, useRef, useState } from "react";
import type { AuthSession, UserProfile } from "../types";
import { DATA_MODE } from "../services/runtime";
import { ApiError } from "../services/http";
import {
  clearStoredAuthToken, getAuthenticatedUser, getStoredAuthToken,
  loginUser, registerUser, setStoredAuthToken,
} from "../services/users";

type AccountStatus = "anonymous" | "checking" | "authenticated" | "error" | "expired";
interface AccountState {
  status: AccountStatus;
  user: UserProfile | null;
  error: string;
  revision: number;
}

export function useAccount() {
  const sequence = useRef(0);
  const authentication = useRef<number | null>(null);
  const [state, setState] = useState<AccountState>({
    status: DATA_MODE === "api" ? "checking" : "anonymous",
    user: null, error: "", revision: 0,
  });

  async function retry() {
    const revision = ++sequence.current;
    authentication.current = null;
    setState({ status: "checking", user: null, error: "", revision });
    try {
      const token = DATA_MODE === "api" ? getStoredAuthToken() : null;
      if (!token) {
        setState({ status: "anonymous", user: null, error: "", revision });
        return;
      }
      const user = await getAuthenticatedUser(token);
      if (sequence.current === revision) {
        setState({ status: "authenticated", user, error: "", revision });
      }
    } catch (error) {
      if (sequence.current !== revision) return;
      const expired = error instanceof ApiError && (error.status === 401 || error.status === 403);
      let expiredMessage = "Your session has expired. Sign in again or sign out.";
      if (expired) {
        try {
          clearStoredAuthToken();
        } catch {
          expiredMessage = "Your session has expired. Unable to clear the saved sign-in; check browser storage and retry sign out.";
        }
      }
      // Connectivity failures must not sign the user out or switch persistence modes.
      setState({
        status: expired ? "expired" : "error", user: null, revision,
        error: expired ? expiredMessage
          : "Unable to check your account. Your sign-in is retained; retry when connected.",
      });
    }
  }

  useEffect(() => {
    void retry();
    return () => { ++sequence.current; authentication.current = null; };
  }, []);

  async function authenticate(request: () => Promise<AuthSession>): Promise<boolean> {
    if (authentication.current !== null) return false;
    const revision = ++sequence.current;
    authentication.current = revision;
    setState({ status: "checking", user: null, error: "", revision });
    try {
      const session = await request();
      if (sequence.current !== revision) return false;
      // Commit credentials only while this login is still the current operation.
      setStoredAuthToken(session.accessToken);
      setState({ status: "authenticated", user: session.user, error: "", revision });
      return true;
    } catch (error) {
      if (sequence.current !== revision) return false;
      setState({
        status: "anonymous", user: null, revision,
        error: error instanceof Error ? error.message : "Sign-in failed. Please retry.",
      });
      return false;
    } finally {
      if (authentication.current === revision) authentication.current = null;
    }
  }

  function logout() {
    const revision = ++sequence.current;
    authentication.current = null;
    try {
      clearStoredAuthToken();
      setState({ status: "anonymous", user: null, error: "", revision });
    } catch {
      setState({
        status: "error", user: null, revision,
        error: "Unable to clear the saved sign-in. Check browser storage and retry sign out.",
      });
    }
  }

  return {
    ...state, retry, logout,
    login: (identifier: string, password: string) => authenticate(() => loginUser(identifier, password)),
    register: (email: string, displayName: string, password: string) =>
      authenticate(() => registerUser(email, displayName, password)),
  };
}
