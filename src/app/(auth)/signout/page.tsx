import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LogOut } from "@/components/icons";
import { SignOutButtons } from "./buttons";

export default function SignOutPage() {
  return (
    <div className="relative min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(14,165,233,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        <div className="bg-[#161b27] border border-white/8 rounded-xl p-8 space-y-6 text-center shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
              <LogOut className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-xl text-white tracking-wide">Sign Out?</h1>
            <p className="text-sm text-muted-foreground">Your watchlist and progress will be saved.</p>
          </div>
          <SignOutButtons />
        </div>
      </div>
    </div>
  );
}
