"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  EyeOpenIcon,
  EyeClosedIcon,
} from "@radix-ui/react-icons";

import ErrorBanner from "../ui/ErrorBanner";
import TextInput from "../ui/TextInput";
import Button from "../ui/Button";

type RegisterResponse = {
  message?: string;
  fields?: {
    field: string;
    message: string;
  }[];
};

export default function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first name and last name!");
      return;
    }

    if (password.length < 8) {
      setError("Please enter a password of length 8 or more!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password,
            confirmPassword,
          }),
        }
      );

      const data: RegisterResponse | null = await res.json().catch(() => null);

      //the register controller returns 201 when it creates an account
      if (res.status !== 201) {
        setError(
          data?.fields?.[0]?.message ??
            data?.message ??
            "Could not create your account! Please try again!"
        );
        return;
      }

      //registration does not create a login session
      setPassword("");
      setConfirmPassword("");
      setIsRegistered(true);
    } catch {
      setError("Could not connect to the server! Please try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="rounded-2xl border border-[#701634] bg-[#d9edf5] p-6">
        <div role="status" aria-live="polite">
          <h2 className="brand-heading text-3xl">You are all set</h2>

          <p className="mt-3 text-sm leading-6 text-[#795b65]">
            Your account has been created successfully. Please Log in to start
            shopping.
          </p>
        </div>

        <Link href="/login" className="brand-button mt-6 w-full text-sm">
          Continue to login
          <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextInput
            id="firstName"
            name="firstName"
            label="First name"
            type="text"
            autoComplete="given-name"
            required
            placeholder="Rajesh"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isSubmitting}
          />

          <TextInput
            id="lastName"
            name="lastName"
            label="Last name"
            type="text"
            autoComplete="family-name"
            required
            placeholder="Hamal"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <TextInput
          id="email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          placeholder="rajeshhamal@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />

        <div>
          <div className="relative">
            <TextInput
              id="password"
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              aria-describedby="password-hint"
              style={{ paddingRight: "48px" }}
            />

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

          <p id="password-hint" className="mt-2 text-xs text-[#795b65]">
            Use at least 8 characters.
          </p>
        </div>

        <div className="relative">
          <TextInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Enter your password again"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            style={{ paddingRight: "48px" }}
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            disabled={isSubmitting}
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
            aria-controls="confirmPassword"
            className="absolute bottom-0 right-0 flex h-12.5 w-12 items-center justify-center rounded-r-xl text-[#795b65] transition-colors hover:text-[#701634] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showConfirmPassword ? (
              <EyeClosedIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeOpenIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="Creating your account"
          className="tracking-wide group"
        >
          Create account
          <ArrowRightIcon
            className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </Button>
      </form>
    </>
  );
}
