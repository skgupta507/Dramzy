import { Metadata } from "next";
import { Flame } from "@/components/icons";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Dramzy Terms and Conditions of Use.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    content: `By accessing or using Dramzy ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not access or use the Platform.

These terms apply to all visitors, users, and others who access or use Dramzy.`,
  },
  {
    title: "Use of the Platform",
    content: `You may use Dramzy for personal, non-commercial streaming of Korean drama content. You agree NOT to:

• Reproduce, distribute, or publicly display any content without authorization
• Use automated systems or bots to access, scrape, or crawl the Platform
• Attempt to reverse engineer, decompile, or extract source code
• Upload malicious code or attempt to disrupt services
• Use the Platform for any illegal or unauthorized purpose
• Impersonate any person or entity

Dramzy reserves the right to terminate access for violations of these terms.`,
  },
  {
    title: "Content Rights",
    content: `All drama content available on Dramzy is sourced through third-party APIs and providers. Dramzy does not host, own, or claim copyright over streaming video content. We are an aggregator and interface platform.

Dramzy's original content — including branding, UI design, code, and copy — is the intellectual property of Dramzy and its creator.

If you are a rights holder and believe content on Dramzy infringes your copyright, please contact us for prompt review and removal.`,
  },
  {
    title: "Account Responsibilities",
    content: `If you create an account on Dramzy:

• You are responsible for maintaining the security of your account
• You are responsible for all activity that occurs under your account
• You must not share account credentials with others
• You must provide accurate and complete information
• You must notify us immediately of any unauthorized use

Dramzy is not liable for losses resulting from unauthorized use of your account.`,
  },
  {
    title: "Platform Limitations",
    content: `Dramzy is provided "as is" without warranties of any kind. We do not guarantee:

• Uninterrupted or error-free access to the Platform
• The accuracy or completeness of drama metadata
• The availability of any particular drama or episode
• Compatibility with all devices or browsers

Streaming sources are provided by third parties and may occasionally be unavailable or removed.`,
  },
  {
    title: "Limitation of Liability",
    content: `To the maximum extent permitted by law, Dramzy and its creator shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to loss of data or service interruption.`,
  },
  {
    title: "Modifications to Terms",
    content: `Dramzy reserves the right to modify these Terms at any time. Changes take effect upon posting to the Platform. Continued use after changes constitutes acceptance of the modified terms. We encourage you to review these Terms periodically.`,
  },
  {
    title: "Governing Law",
    content: `These Terms are governed by and construed in accordance with applicable laws. Any disputes arising from use of Dramzy shall be resolved through good-faith negotiation.`,
  },
];

export default function TermsPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container max-w-3xl mx-auto px-4 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
            <span className="font-heading text-xs tracking-[0.3em] text-brand-600 uppercase">Legal</span>
          </div>
          <h1 className="font-heading font-black text-4xl text-white glow-text-subtle">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground text-sm font-sans">Last updated: January 2025</p>
          <p className="font-sans text-base text-white/60 leading-relaxed">
            Please read these Terms and Conditions carefully before using Dramzy. 
            Your use of the Platform constitutes your agreement to these terms.
          </p>
        </div>

        <div className="infernal-divider" />

        <div className="space-y-8">
          {sections.map((section, i) => (
            <section key={i} className="space-y-3">
              <h2 className="font-heading text-lg font-bold text-white">
                {i + 1}. {section.title}
              </h2>
              <div className="font-sans text-sm text-white/65 leading-relaxed whitespace-pre-line pl-4 border-l border-brand-900/30">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <div className="infernal-divider" />

        <p className="font-sans text-xs text-muted-foreground text-center">
          Dramzy — Forged in darkness by Sunil. All rights reserved.
        </p>
      </div>
    </div>
  );
}
