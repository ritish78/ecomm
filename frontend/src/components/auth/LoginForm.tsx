"use client";

import React, { useState } from "react";
import ErrorBanner from "../ui/ErrorBanner";
import TextInput from "../ui/TextInput";
import Button from "../ui/Button";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      console.log("Logging in with", { email, password });
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
