import GoogleLogin from "@/components/auth/GoogleLogIn";
import LoginForm from "@/components/auth/LoginForm";
import BrandFlower from "@/components/ui/BrandFlower";
import Divider from "@/components/ui/Divider";
import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="login-page" aria-labelledby="login-title">
      <div className="login-shell">
        <div className="login-story brand-tiles">
          <div className="relative z-10">
            <BrandFlower />

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em]">
              Familiar flavours. Everyday favourites.
            </p>

            <h2 className="brand-heading login-story-title">
              A little
              <br />
              closer
              <br />
              to home.
            </h2>

            <p className="login-story-caption">
              From the rice in your cupboard to your favourite bowl of noodles.
              Good things belong in your basket.
            </p>
          </div>

          <div className="login-story-label">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
              Your next
            </p>

            <p className="brand-heading mt-2 text-3xl">pantry refill</p>

            <p className="mt-2 text-xs">starts here.</p>
          </div>
        </div>

        <div className="login-panel">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#795b65]">
            Your account
          </p>

          <h1 id="login-title" className="brand-heading text-4xl sm:text-5xl">
            Welcome back.
          </h1>

          <p className="mb-8 mt-4 text-sm leading-6 text-[#795b65]">
            Log in to continue shopping and keep track of your orders.
          </p>

          <LoginForm />

          <Divider label="or" />

          <GoogleLogin />
          <p className="mt-6 text-center text-sm text-[#795b65]">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#701634] underline-offset-4 hover:underline"
            >
              Create an account
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
