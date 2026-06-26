"use client";

import { useState } from "react";
import Button from "../ui/Button";
import { Icons } from "../ui/Icons";

export default function GoogleLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: `${window.location.origin}/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <Button
      type="button"
      variant="secondary"
      isLoading={isLoading}
      loadingText="Redirecting!"
      onClick={handleGoogleLogin}
    >
      <Icons.google className="h-4 w-4" />
      Login with Google
    </Button>
  );
}
