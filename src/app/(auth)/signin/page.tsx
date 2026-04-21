import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Zap } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { UserAuthForm } from "./user-auth-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Dramzy to track watchlists and save progress.",
};

export default function SignInPage() {
  return (
    <div className="relative min-h-screen bg-[#0f1117] flex items-center justify-center overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(14,165,233,0.06)_0%,transparent_65%)] pointer-events-none" />

      {/* Back */}
      <div className="absolute top-5 left-5 z-10">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        <div className="bg-[#161b27] border border-white/8 rounded-xl p-8 space-y-7 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow-sm">
                <Zap className="w-6 h-6 text-white fill-white" strokeWidth={2} />
              </div>
            </div>
            <div>
              <h1 className="font-heading text-2xl text-white tracking-widest">DRAMZY</h1>
              <p className="text-xs text-muted-foreground mt-1">Sign in to your account</p>
            </div>
          </div>

          {/* OAuth buttons */}
          <UserAuthForm />

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
