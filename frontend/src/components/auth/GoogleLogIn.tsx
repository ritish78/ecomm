"use client";

import Button from "../ui/Button";
import { Icons } from "../ui/Icons";

export default function GoogleLogin() {
  const handleGoogleLogin = () => {
    console.log("Clicked on Logged in using Google!");
  };
  return (
    <Button type="button" variant="secondary" onClick={handleGoogleLogin}>
      <Icons.google className="h-4 w-4" />
      Login with Google
    </Button>
  );
}
