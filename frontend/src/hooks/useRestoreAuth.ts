import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export function useRestoreAuth() {
  const { setAuth, clearAuth, setRestoring } = useAuthStore();

  useEffect(() => {
    const restore = async () => {
      //TODO: might need to optimize our current implementation again. Looking at the console in browser,
      //we are fetching /api/v1/auth/me and /api/v1/auth/refresh again and again
      try {
        const meResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/me`,
          {
            credentials: "include",
          }
        );

        if (meResponse.ok) {
          const data = await meResponse.json();
          setAuth(data.user, ""); //accessToken is in cookies, so not saving in memory
          return;
        }

        //if we don't get a 200 response back, then it means that the accessToken is expired
        //so, we get a new one using the refreshToken

        //if the server returns 500, it does not mean that the accessToken is expired
        if (meResponse.status !== 401) {
          console.error("Could not restore auth. Please try again later!");
          return;
        }

        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/refresh`,
          { method: "POST", credentials: "include" }
        );

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAuth(data.user, "");
          return;
        }

        //in the case where /me and /refresh endpoint fails, the user is logged out
        // clearAuth();

        //we only clear the user if the refresh token is also missing or is invalid
        if (refreshResponse.status === 401) {
          clearAuth();
          return;
        }

        console.error("Could not restore auth. Please try again later!");
      } catch (error) {
        // clearAuth();

        //a network error could have happened, so we do not want the user to be logged out
        console.error("Could not restore auth. Please try again later!", error);
      } finally {
        setRestoring(false);
      }
    };

    restore();
  }, [setAuth, clearAuth, setRestoring]);
}
