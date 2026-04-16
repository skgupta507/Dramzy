import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/lib/auth";

export default async function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="relative flex min-h-screen flex-col bg-[#0f1117]">
      {/* Subtle top radial glow */}
      <div className="fixed inset-x-0 top-0 h-[400px] pointer-events-none z-0
        bg-[radial-gradient(ellipse_80%_40%_at_50%_-5%,rgba(14,165,233,0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <SiteHeader sticky session={session} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
