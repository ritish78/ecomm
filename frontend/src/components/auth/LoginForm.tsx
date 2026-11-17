"use client";

import React, { useState } from "react";
import ErrorBanner from "../ui/ErrorBanner";
import TextInput from "../ui/TextInput";
import Button from "../ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  EyeClosedIcon,
  EyeOpenIcon,
} from "@radix-ui/react-icons";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // console.log("Logging in with", { email, password });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Login failed! Please try again!");

        return;
      }

      const data = await res.json();
      setAuth(data.user, "");

      //we only redirect to a page within our own website
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect"
      );
      let redirectTo = "/";

      if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
        try {
          const redirectUrl = new URL(redirect, window.location.origin);

          if (
            redirectUrl.origin === window.location.origin &&
            redirectUrl.pathname !== "/login" &&
            !redirectUrl.pathname.startsWith("/login/") &&
            redirectUrl.pathname !== "/register" &&
            !redirectUrl.pathname.startsWith("/register/")
          ) {
            redirectTo =
              redirectUrl.pathname + redirectUrl.search + redirectUrl.hash;
          }
        } catch {
          //if the redirect is invalid, we then use the home page
        }
      }

      router.replace(redirectTo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again!";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextInput
          id="email"
          name="email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="rajeshhamal@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative">
          <TextInput
            id="password"
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            style={{ paddingRight: "48px" }}
          />

          {/* the button is aligned with the input below its label */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isSubmitting}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="password"
            className="absolute bottom-0 right-0 flex h-12.5 w-12 items-center justify-center rounded-r-xl text-[#795b65] transition-colors hover:text-[#701634] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPassword ? (
              <EyeClosedIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeOpenIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="Logging in"
          className="tracking-wide group"
        >
          Log in
          <ArrowRightIcon
            className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </Button>
      </form>
    </>
  );
}
