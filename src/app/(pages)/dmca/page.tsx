import { Metadata } from "next";
import { Shield, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DMCA Policy",
  description: "Dramzy DMCA takedown policy and content removal request process.",
};

export default function DmcaPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container max-w-3xl mx-auto px-4 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" strokeWidth={1.5} />
            <span className="text-xs font-semibold text-brand-400 tracking-widest uppercase">Legal</span>
          </div>
          <h1 className="font-heading text-5xl text-white tracking-wide">DMCA Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: {new Date().getFullYear()}</p>
        </div>

        <div className="p-5 rounded-lg border border-yellow-700/30 bg-yellow-950/10 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-yellow-400">Important Notice</p>
            <p className="text-sm text-muted-foreground">
              Dramzy is an index/aggregator platform. We do not host, upload, or store any video content on our servers.
              All streams are sourced from third-party providers. We respect intellectual property rights and respond
              promptly to valid DMCA takedown requests.
            </p>
          </div>
        </div>

        <div className="border-t border-border/30 pt-1" />

        {/* Sections */}
        {[
          {
            title: "1. What Is the DMCA?",
            content: `The Digital Millennium Copyright Act (DMCA) is a United States copyright law that provides a framework for copyright holders to request the removal of infringing content from online platforms. Dramzy complies with the DMCA and will respond to valid takedown notices expeditiously.`,
          },
          {
            title: "2. Our Platform's Nature",
            content: `Dramzy operates as a search index and metadata aggregator. We do not upload, host, or control the streaming content shown on this platform. All video streams originate from third-party providers and websites. Our service merely indexes and links to content already publicly available on the internet.

If you find content that infringes your copyright, you may submit a takedown notice to us to have the link or metadata removed from our index. However, removing content from Dramzy does not remove it from the original hosting source.`,
          },
          {
            title: "3. Filing a DMCA Takedown Notice",
            content: `To submit a valid DMCA takedown notice, your request must include all of the following:

• Your full legal name and contact information (email, address, phone)
• Identification of the copyrighted work you claim has been infringed
• The specific URL(s) on Dramzy where the infringing content appears
• A statement that you have a good faith belief that the use is not authorized
• A statement that the information in your notice is accurate
• A statement, under penalty of perjury, that you are the copyright owner or authorized to act on their behalf
• Your physical or electronic signature

Incomplete notices will not be processed. Send your notice to our designated DMCA agent.`,
          },
          {
            title: "4. Where to Send Your Notice",
            content: `Email your DMCA takedown notice to our designated agent. We process requests within 5–10 business days.

Please include "DMCA Takedown Request" in your subject line.

We strongly recommend sending your notice also to the original content host, as that is the only way to have the actual video file removed from the internet.`,
          },
          {
            title: "5. Counter-Notification",
            content: `If you believe your content was removed in error, you may submit a counter-notification. Your counter-notice must include:

• Your full name and contact information
• Identification of the removed content and its original URL
• A statement, under penalty of perjury, that you have a good faith belief the content was removed by mistake
• Your consent to jurisdiction in your local federal district court
• Your physical or electronic signature

Upon receiving a valid counter-notice, we will forward it to the original complainant and may restore the content within 10–14 business days unless the complainant files a court action.`,
          },
          {
            title: "6. Repeat Infringer Policy",
            content: `Dramzy maintains a strict repeat infringer policy. Users who repeatedly submit or promote infringing content may have their access to the platform terminated.`,
          },
          {
            title: "7. Limitation of Liability",
            content: `Dramzy is not liable for the content hosted on third-party servers. By aggregating links to publicly available content, we operate under the safe harbor provisions of the DMCA (17 U.S.C. § 512). We act in good faith upon receiving valid takedown notices and comply as required by law.`,
          },
        ].map(({ title, content }) => (
          <section key={title} className="space-y-3">
            <h2 className="font-heading text-xl text-white tracking-wide">{title}</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-4 border-l border-border/40">
              {content}
            </div>
          </section>
        ))}

        <div className="border-t border-border/30 pt-1" />

        {/* Contact card */}
        <div className="p-6 rounded-lg bg-secondary/30 border border-white/6 space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-500" />
            <h3 className="font-heading text-lg text-white tracking-wide">Contact Our DMCA Agent</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Send all DMCA notices to the email below. Include all required elements listed in Section 3.
            Notices that are incomplete or do not meet DMCA requirements will not be processed.
          </p>
          <div className="flex items-center gap-3 p-3 rounded border border-border bg-secondary/40">
            <Mail className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="text-brand-400 text-sm font-medium">dmca@dramzy.stream</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Expected response time: 5–10 business days. For urgent matters, include "URGENT" in your subject line.
          </p>
        </div>

        {/* Related links */}
        <div className="flex flex-wrap gap-3 pt-2">
          {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms & Conditions", href: "/terms" }, { label: "About Dramzy", href: "/about" }].map(({ label, href }) => (
            <Link key={href} href={href} className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
              {label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          Dramzy — Crafted by Sunil. All rights reserved.
        </p>
      </div>
    </div>
  );
}
