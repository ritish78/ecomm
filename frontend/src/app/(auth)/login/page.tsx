import GoogleLogin from "@/components/auth/GoogleLogIn";
import LoginForm from "@/components/auth/LoginForm";
import Divider from "@/components/ui/Divider";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-8 dark:bg-transparent p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Login
          </h1>
        </div>

        <LoginForm />

        <Divider />
        <GoogleLogin />

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          New here?{" "}
          <a
            href="/register"
            className="text-emerald-500 hover:text-emerald-800 font-medium"
          >
            Create an account here!
          </a>
        </p>
      </div>
    </div>
  );
}
