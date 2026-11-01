import Link from "next/link";

import RegisterForm from "@/components/auth/RegisterForm";
import BrandFlower from "@/components/ui/BrandFlower";

export default function RegisterPage() {
  return (
    <section className="login-page" aria-labelledby="register-title">
      <div className="login-shell">
        <div className="login-story brand-tiles">
          <div className="relative z-10">
            <BrandFlower />

            <h2 className="brand-heading login-story-title">
              Good things
              <br />
              start
              <br />
              here.
            </h2>

            <p className="login-story-caption">
              Get your groceries, everday essentials with a taste of your home.
              Create your account and buy from us.
            </p>
          </div>

          <div className="login-story-label">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
              A little closer
            </p>

            <p className="brand-heading mt-2 text-3xl">to home.</p>

            <p className="mt-2 text-xs">One tea at a time.</p>
          </div>
        </div>

        <div className="login-panel">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#795b65]">
            Join us
          </p>

          <h1
            id="register-title"
            className="brand-heading text-4xl sm:text-5xl"
          >
            Make yourself
            <br />
            at home.
          </h1>

          <p className="mb-8 mt-4 text-sm leading-6 text-[#795b65]">
            Create your account and start shopping.
          </p>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-[#795b65]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#701634] underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      <div className="login-shelf" aria-hidden="true">
        RICE &nbsp; · &nbsp; MASALA &nbsp; · &nbsp; NOODLES &nbsp; · &nbsp; DAL
        &nbsp; · &nbsp; GHEE &nbsp; · &nbsp; CHIURA
      </div>
    </section>
  );
}
