import { Link } from "wouter";
import { ShieldAlert, FileText, ArrowRight, ShieldCheck, AlertTriangle, MessageSquare, HelpCircle, Flag, Cpu, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="w-full text-white py-20 md:py-28 px-4 border-b border-border"
        style={{ background: "linear-gradient(to bottom, #0F1419, #1A2332)" }}
      >
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-white/20 bg-white/10 rounded-lg mb-2">
            <ShieldAlert className="h-7 w-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-[30px] md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-white">
            Verify suspicious calls<br className="hidden md:block" /> and messages instantly.
          </h1>
          <p className="text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
            A free public safety utility to help citizens identify "digital arrest" scams,
            impersonators, and financial fraud before it's too late.
          </p>

          {/* Trust indicator pills */}
          <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
            {[
              { icon: <Cpu className="h-3.5 w-3.5" />, label: "Powered by AI" },
              { icon: <Zap className="h-3.5 w-3.5" />, label: "Instant Results" },
              { icon: <Lock className="h-3.5 w-3.5" />, label: "Free to Use" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white/85"
              >
                {icon}
                {label}
              </span>
            ))}
          </div>

          <div className="pt-4">
            <Link href="/check">
              <Button
                size="lg"
                className="bg-[#4A9EFF] text-[#0F1419] hover:bg-[#4A9EFF]/90 text-base px-8 py-3 rounded-lg font-semibold shadow-card"
                data-testid="button-hero-start"
              >
                Start a Verification Check <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How to use ────────────────────────────────────────────────── */}
      <section className="w-full py-14 px-4 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[20px] font-semibold text-foreground mb-2">
              How to Use Citizen Fraud Shield
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
              Four simple steps — no account, no installation required.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                n: "1",
                icon: <MessageSquare className="h-6 w-6 text-primary" strokeWidth={1.5} />,
                title: "Paste or Record",
                body: "Paste a suspicious SMS, WhatsApp message, or email — or record/upload a call directly in the app.",
              },
              {
                n: "2",
                icon: <HelpCircle className="h-6 w-6 text-primary" strokeWidth={1.5} />,
                title: "Answer Follow-up Questions",
                body: "If more context is needed, answer up to two quick questions so the AI can make an accurate assessment.",
              },
              {
                n: "3",
                icon: <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={1.5} />,
                title: "Get Your Verdict",
                body: "Receive an instant risk verdict — High, Uncertain, or Low — with a plain-language explanation you can act on.",
              },
              {
                n: "4",
                icon: <Flag className="h-6 w-6 text-primary" strokeWidth={1.5} />,
                title: "Report If High Risk",
                body: "High-risk results include direct links to file a report at cybercrime.gov.in and the 1930 fraud helpline.",
              },
            ].map(({ n, icon, title, body }) => (
              <div key={n} className="bg-[#212D3F] border border-border rounded-lg p-5 flex flex-col gap-4 shadow-card">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <span className="text-[13px] font-semibold text-muted-foreground">
                    {n}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Threat awareness ──────────────────────────────────────────── */}
      <section className="w-full py-16 px-4 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[20px] font-semibold text-foreground mb-3">
              Fraud that exploits fear and authority
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto leading-relaxed">
              In 2024, digital arrest scams and cyber fraud caused massive financial losses across India.
              Fraudsters use fear, urgency, and authority impersonation to bypass your critical thinking.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-6 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 flex items-center justify-center bg-[#212D3F] rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-base text-foreground">Fake Officials</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Scammers posing as CBI, customs, or telecom regulators threaten immediate arrest or
                service disconnection to extract money.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 flex items-center justify-center bg-[#212D3F] rounded-lg">
                  <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-base text-foreground">Fabricated Documents</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Victims receive convincing but forged warrants, court notices, or RBI guidelines
                via WhatsApp or email to manufacture legitimacy.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 flex items-center justify-center bg-[#212D3F] rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-base text-foreground">Protect Yourself</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Pause, do not pay, and verify. Real authorities will never ask for money transfers
                via UPI to resolve an investigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="w-full py-16 px-4" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[20px] font-semibold text-foreground mb-3">
              Citizen Fraud Shield — Step by Step
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Simple, private, and instant — no account required.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                n: "1",
                title: "Submit Suspicious Content",
                body: "Type or paste the message, describe the phone call, or record audio of the conversation. We support text, WhatsApp messages, emails, and voice recordings.",
              },
              {
                n: "2",
                title: "Instant AI Analysis",
                body: "Our system scans for known fraud patterns, psychological manipulation tactics, and government impersonation keywords used in real scams.",
              },
              {
                n: "3",
                title: "Get a Verdict & Action Plan",
                body: "Receive an immediate risk assessment — High, Uncertain, or Low — with plain-language reasoning and clear steps to report or block the threat.",
              },
            ].map(({ n, title, body }) => (
              <div
                key={n}
                className="flex flex-col md:flex-row gap-5 items-start md:items-center bg-card border border-border rounded-lg p-6 shadow-card"
              >
                <div className="flex-shrink-0 w-9 h-9 border border-border bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm rounded-lg">
                  {n}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/check">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-7 py-2.5 font-semibold">
                Run a Verification Check
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
