"use client";

import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import { Icons } from "../ui/Icons";

export default function GoogleLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const handleCredentialResponse = async (response: { credential: string }) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken: response.credential }), //matches our backend schema
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Google login failed");
      }

      const data = await res.json();
      console.log("Logged in:", data.user);
      //Todo: store user in auth state/redirect
      //need to implement state management library. might use zustand.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;

    const init = () => {
      if (!window.google) return;
      initialized.current = true;

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleCredentialResponse,
      });
    };

    if (window.google) {
      init();
    } else {
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

      script?.addEventListener("load", init);

      return () => script?.removeEventListener("load", init);
    }
  });

  const handleGoogleLogin = () => {
    if (!window.google) return;
    window.google.accounts.id.prompt();
  };
  return (
    <Button type="button" variant="secondary" onClick={handleGoogleLogin}>
      <Icons.google className="h-4 w-4" />
      Login with Google
    </Button>
  );
}
