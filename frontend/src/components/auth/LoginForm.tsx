"use client";

import React, { useState } from "react";
import ErrorBanner from "../ui/ErrorBanner";
import TextInput from "../ui/TextInput";
import Button from "../ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      console.log("Logging in with", { email, password });

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
        setError(data.message ?? data.message);

        return;
      }

      const data = await res.json();
      setAuth(data.user, "");
      router.replace("/");
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          id="email"
          label="Email"
          type="email"
          required
          placeholder="rajeshhamal@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextInput
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" isLoading={isSubmitting} loadingText="Logging in">
          Log in
        </Button>
      </form>
    </>
  );
}
