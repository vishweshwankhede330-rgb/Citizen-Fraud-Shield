import { useState } from "react";
import { useRoute, Link, Redirect } from "wouter";
import { useStore, RiskLevel } from "@/lib/store";
import NearbyPoliceStations from "@/components/NearbyPoliceStations";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  PhoneForwarded,
  Share2,
  Copy,
  ExternalLink,
  Phone,
  Info,
  Send,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/session";

export default function Result() {
  const [, params] = useRoute("/result/:id");
  const { getCheck } = useStore();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const check = getCheck(params?.id || "");

  if (!check) {
    return <Redirect to="/history" />;
  }

  const getRiskConfig = (level: RiskLevel) => {
    switch (level) {
      case "High Risk":
        return {
          icon: <ShieldAlert className="h-12 w-12 text-[#B3261E]" strokeWidth={1.5} />,
          bg: "bg-[#FDECEA]",
          border: "border-[#f5c6c4]",
          text: "text-[#B3261E]",
          badge: "bg-[#FDECEA] text-[#B3261E] border border-[#f5c6c4]",
          title: "High Risk Detected",
          description:
            "This communication strongly matches known fraud patterns. Do not engage.",
        };
      case "Uncertain":
        return {
          icon: <AlertTriangle className="h-12 w-12 text-[#946800]" strokeWidth={1.5} />,
          bg: "bg-[#FFF4E0]",
          border: "border-[#f5de8a]",
          text: "text-[#946800]",
          badge: "bg-[#FFF4E0] text-[#946800] border border-[#f5de8a]",
          title: "Exercise Caution",
          description:
            "This communication contains suspicious elements. Verify independently.",
        };
      case "Low Risk":
        return {
          icon: <ShieldCheck className="h-12 w-12 text-[#2D6A4F]" strokeWidth={1.5} />,
          bg: "bg-[#E8F3EC]",
          border: "border-[#a8c8b5]",
          text: "text-[#2D6A4F]",
          badge: "bg-[#E8F3EC] text-[#2D6A4F] border border-[#a8c8b5]",
          title: "Low Risk",
          description:
            "No significant fraud patterns detected, but always stay vigilant.",
        };
    }
  };

  const config = getRiskConfig(check.riskLevel);
  const isHighRisk = check.riskLevel === "High Risk";

  const copyVerdict = () => {
    const text = [
      `Citizen Fraud Shield — Verification Report`,
      `Checked: ${new Date(check.timestamp).toLocaleString()}`,
      `Verdict: ${check.riskLevel} (${check.confidenceScore}% confidence)`,
      ``,
      `Analysis:`,
      ...check.reasons.map((r, i) => `${i + 1}. ${r}`),
      ``,
      `Recommended Actions:`,
      ...(check.recommendedActions ?? []).map((a) => `• ${a}`),
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 py-8 md:py-12">
      <Link
        href="/check"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        New Check
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ── Main column ───────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-4">

          {/* Verdict card */}
          <div className={`rounded-lg border ${config.border} ${config.bg} p-7 text-center`}>
            <div className="flex justify-center mb-5">
              <div className="bg-white rounded-lg p-3.5 border border-border">
                {config.icon}
              </div>
            </div>
            <h1 className={`text-[20px] font-semibold mb-2 ${config.text}`}>
              {config.title}
            </h1>
            <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
              {config.description}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2">
              <span className={`inline-block px-4 py-1.5 rounded-lg text-xs font-semibold ${config.badge}`}>
                Confidence: {check.confidenceScore}%
              </span>
              {check.crimeCategory && (
                <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-muted-foreground border border-border">
                  {check.crimeCategory}
                </span>
              )}
            </div>
          </div>

          {/* Plain-language explanation */}
          {check.simpleExplanation && (
            <div className="bg-white rounded-lg border border-border p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg border border-border bg-primary/8 flex items-center justify-center mt-0.5">
                  <Info className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-1.5">
                    What This Means for You
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {check.simpleExplanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* High-risk reporting section */}
          {isHighRisk && check.crimeCategory !== "Not a Recognized Scam Pattern" && (
            <div className="rounded-lg border border-[#f5c6c4] bg-[#FDECEA] p-5 space-y-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[#B3261E]">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                Report This Scam
              </h2>
              <div className="space-y-3">
                <a
                  href="https://cybercrime.gov.in/Webform/Crime_AuthoLogin.aspx?rnt=5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white border border-[#f5c6c4] rounded-lg px-4 py-3 text-sm font-semibold text-[#B3261E] hover:bg-[#FDECEA] transition-colors"
                >
                  <ExternalLink className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                  Report to Cyber Crime Portal (cybercrime.gov.in)
                </a>
                <div className="bg-white border border-[#f5c6c4] rounded-lg px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#B3261E] flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-[#B3261E]">
                      Call 1930
                    </span>
                    <span className="text-xs bg-[#FDECEA] text-[#B3261E] px-2 py-0.5 rounded-lg font-medium">
                      National Cyber Fraud Helpline
                    </span>
                  </div>
                  <p className="text-xs text-[#B3261E]/80 pl-6 leading-relaxed">
                    Call 1930 immediately if you have already shared money or
                    bank details — this can help freeze the transaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit complaint to Police Dashboard */}
          {isHighRisk && (
            <div className="bg-white rounded-lg border border-border p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1">
                <Send className="h-4 w-4 flex-shrink-0 text-[#2C4A6B]" strokeWidth={1.5} />
                Submit to Police Dashboard
              </h2>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Help law enforcement track fraud patterns in your area by submitting
                this complaint to the shared Police Dashboard.
              </p>

              {submitStatus === "idle" && (
                <Button
                  size="sm"
                  className="bg-[#2C4A6B] hover:bg-[#2C4A6B]/90 text-white rounded-lg text-xs"
                  onClick={async () => {
                    setSubmitStatus("submitting");
                    setSubmitError(null);
                    try {
                      const sessionId = getSessionId();
                      const res = await fetch("/api/complaints", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          session_id: sessionId,
                          message_text: check.query,
                          risk_level: check.riskLevel,
                          crime_category: check.crimeCategory,
                          city: check.city,
                          pincode: check.pincode,
                          result_id: check.id,
                        }),
                      });
                      const data = (await res.json()) as { id?: string; error?: string };
                      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to submit.");
                      setComplaintId(data.id ?? null);
                      setSubmitStatus("done");
                    } catch (err: unknown) {
                      setSubmitError(err instanceof Error ? err.message : "Failed to submit.");
                      setSubmitStatus("error");
                    }
                  }}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Submit Complaint to Police Dashboard
                </Button>
              )}

              {submitStatus === "submitting" && (
                <p className="text-xs text-muted-foreground">Submitting…</p>
              )}

              {submitStatus === "done" && (
                <div className="flex items-start gap-2.5 bg-[#E8F3EC] border border-[#a8c8b5] rounded-lg px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-[#2D6A4F] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-semibold text-[#2D6A4F] mb-0.5">
                      Complaint submitted successfully.
                    </p>
                    {complaintId && (
                      <p className="text-xs text-[#2D6A4F]/80">
                        Complaint ID:{" "}
                        <span className="font-mono font-semibold">
                          {complaintId.slice(0, 8).toUpperCase()}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="space-y-2">
                  <p className="text-xs text-[#B3261E] font-medium">{submitError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-xs"
                    onClick={() => setSubmitStatus("idle")}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Nearby police stations */}
          {isHighRisk && check.city && (
            <NearbyPoliceStations city={check.city} pincode={check.pincode} />
          )}

          {/* Analysis reasons */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 pb-3 border-b border-border">
              Analysis Details
            </h2>
            <ul className="space-y-3.5">
              {check.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground font-semibold text-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-muted-foreground text-sm leading-relaxed">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Submitted content */}
          <div className="bg-white rounded-lg border border-border p-5">
            <h3 className="text-[13px] font-semibold text-muted-foreground mb-3">
              Submitted Content
            </h3>
            <div className="bg-background p-4 rounded-lg border border-border text-muted-foreground text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {check.query}
            </div>
            <div className="mt-2.5 text-xs text-muted-foreground">
              Checked on {new Date(check.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        {/* ── Action panel ──────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-[#2C4A6B] text-white rounded-lg p-5">
            <h2 className="text-[13px] font-semibold text-white/70 mb-4">
              Recommended Actions
            </h2>
            <div className="space-y-2.5">
              {isHighRisk && (
                <div className="flex items-center gap-3 bg-white/10 rounded-lg px-3.5 py-3">
                  <PhoneForwarded className="h-4 w-4 text-[#f5a6a3] flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="font-semibold text-sm text-white">Report to 1930</p>
                    <p className="text-xs text-white/60">National Cyber Crime Helpline</p>
                  </div>
                </div>
              )}
              {(check.recommendedActions ?? []).map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white/80"
                >
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5" />
                  {action}
                </div>
              ))}
              <div className="pt-1 space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start bg-white/10 text-white hover:bg-white/20 border-0 rounded-lg text-xs font-medium"
                  onClick={copyVerdict}
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy Verdict Details
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start bg-white/10 text-white hover:bg-white/20 border-0 rounded-lg text-xs font-medium"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Fraud Check: ${check.riskLevel}`,
                        text: `I verified a suspicious message. Result: ${check.riskLevel} (${check.confidenceScore}% confidence)`,
                      }).catch(() => {});
                    }
                  }}
                >
                  <Share2 className="mr-2 h-3.5 w-3.5" />
                  Share with Family Member
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-border p-5">
            <h3 className="text-[13px] font-semibold text-muted-foreground mb-3">
              Golden Rules of Safety
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5" />
                Real law enforcement will never demand money over the phone or WhatsApp.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5" />
                There is no official system of "Digital Arrest" under Indian law.
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5" />
                Never transfer funds to "safe accounts" dictated by callers.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
