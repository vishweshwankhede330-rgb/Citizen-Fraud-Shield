import { useState, useRef, useCallback, useEffect } from "react";
import {
  Shield,
  Mic,
  Upload,
  Send,
  Square,
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Phone,
  Copy,
  Share2,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, CITY_LIST, type City, type RiskLevel } from "@/lib/store";
import NearbyPoliceStations from "@/components/NearbyPoliceStations";
import { getSessionId } from "@/lib/session";

// ── Types ──────────────────────────────────────────────────────────────────

type AudioStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "transcribing"
  | "error";

type FinalVerdictData = {
  risk_level: "High" | "Low" | "Uncertain";
  confidence: number;
  crime_category: string;
  reasons: string[];
  recommended_actions: string[];
  simple_explanation: string;
};

type ChatMessage =
  | { id: string; kind: "ai-greeting" }
  | { id: string; kind: "user-input"; text: string }
  | { id: string; kind: "ai-typing" }
  | { id: string; kind: "ai-followup"; questions: string[] }
  | { id: string; kind: "user-answers"; pairs: { question: string; answer: string }[] }
  | { id: string; kind: "ai-verdict"; data: FinalVerdictData; savedId: string }
  | { id: string; kind: "ai-error"; message: string };

function mapRiskLevel(level: "High" | "Low" | "Uncertain"): RiskLevel {
  if (level === "High") return "High Risk";
  if (level === "Low") return "Low Risk";
  return "Uncertain";
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Risk helpers ───────────────────────────────────────────────────────────

function getRiskStyle(level: "High" | "Low" | "Uncertain") {
  switch (level) {
    case "High":
      return {
        icon: <ShieldAlert className="h-7 w-7 text-[#FF6B6B]" strokeWidth={1.5} />,
        border: "border-[#3A1418]",
        bg: "bg-[#3A1418]",
        text: "text-[#FF6B6B]",
        badge: "bg-[#3A1418] text-[#FF6B6B] border border-[#3A1418]",
        title: "High Risk Detected",
      };
    case "Uncertain":
      return {
        icon: <AlertTriangle className="h-7 w-7 text-[#FFC857]" strokeWidth={1.5} />,
        border: "border-[#3A2E0F]",
        bg: "bg-[#3A2E0F]",
        text: "text-[#FFC857]",
        badge: "bg-[#3A2E0F] text-[#FFC857] border border-[#3A2E0F]",
        title: "Exercise Caution",
      };
    case "Low":
      return {
        icon: <ShieldCheck className="h-7 w-7 text-[#4ADE80]" strokeWidth={1.5} />,
        border: "border-[#10301F]",
        bg: "bg-[#10301F]",
        text: "text-[#4ADE80]",
        badge: "bg-[#10301F] text-[#4ADE80] border border-[#10301F]",
        title: "Low Risk",
      };
  }
}

// ── Bubble components ──────────────────────────────────────────────────────

function AiBubble({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[85%] bg-card border border-border rounded-lg p-4 text-sm text-foreground leading-relaxed ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-[#1A3A5F] rounded-lg p-4 text-sm text-white leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Verdict bubble ─────────────────────────────────────────────────────────

function VerdictBubble({
  data,
  savedId,
  city,
  pincode,
  onNewCheck,
}: {
  data: FinalVerdictData;
  savedId: string;
  city?: City;
  pincode?: string;
  onNewCheck: () => void;
}) {
  const style = getRiskStyle(data.risk_level);
  const isHighRisk = data.risk_level === "High";
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const copyVerdict = () => {
    const text = [
      `Citizen Fraud Shield — Verification Report`,
      `Verdict: ${mapRiskLevel(data.risk_level)} (${data.confidence}% confidence)`,
      ``,
      `Analysis:`,
      ...data.reasons.map((r, i) => `${i + 1}. ${r}`),
      ``,
      `Recommended Actions:`,
      ...data.recommended_actions.map((a) => `• ${a}`),
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="flex justify-start w-full">
      <div
        className={`w-full bg-card border-2 ${style.border} rounded-lg p-6 space-y-5`}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`${style.bg} rounded-lg p-2.5 border ${style.border}`}>
            {style.icon}
          </div>
          <div className="min-w-0">
            <h2 className={`text-[20px] font-semibold ${style.text} leading-tight`}>
              {style.title}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className={`inline-block px-3 py-0.5 rounded-lg text-xs font-semibold ${style.badge}`}>
                Confidence: {data.confidence}%
              </span>
              {data.crime_category && (
                <span className="inline-block px-3 py-0.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {data.crime_category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Plain-language explanation */}
        {data.simple_explanation && (
          <div className="bg-background rounded-lg p-4 border border-border">
            <p className="text-[13px] font-semibold text-muted-foreground mb-1.5">
              What This Means for You
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.simple_explanation}
            </p>
          </div>
        )}

        {/* Analysis reasons */}
        <div>
          <p className="text-[13px] font-semibold text-muted-foreground mb-2">
            Analysis Details
          </p>
          <ul className="space-y-2">
            {data.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="flex-shrink-0 w-5 h-5 rounded-lg border border-border bg-background flex items-center justify-center font-semibold text-xs text-muted-foreground mt-0.5">
                  {idx + 1}
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended actions */}
        {data.recommended_actions.length > 0 && (
          <div>
            <p className="text-[13px] font-semibold text-muted-foreground mb-2">
              Recommended Actions
            </p>
            <ul className="space-y-1.5">
              {data.recommended_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* High-risk reporting */}
        {isHighRisk && data.crime_category !== "Not a Recognized Scam Pattern" && (
          <div className="rounded-lg border border-[#3A1418] bg-[#3A1418] p-4 space-y-3">
            <p className="text-[13px] font-semibold text-[#FF6B6B]">Report This Scam</p>
            <div className="space-y-2">
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#212D3F] border border-[#3A1418] rounded-lg px-4 py-2.5 text-sm font-semibold text-[#FF6B6B] hover:bg-[#3A1418]/70 transition-colors"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                Report to Cyber Crime Portal (cybercrime.gov.in)
              </a>
              <div className="bg-[#212D3F] border border-[#3A1418] rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#FF6B6B] flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-bold text-[#FF6B6B]">Call 1930</span>
                  <span className="text-xs bg-[#3A1418] text-[#FF6B6B] px-2 py-0.5 rounded-lg font-medium">
                    National Cyber Fraud Helpline
                  </span>
                </div>
                <p className="text-xs text-[#FF6B6B]/80 pl-6 mt-1 leading-relaxed">
                  Call 1930 immediately if you have already shared money or bank details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit complaint to Police Dashboard */}
        {isHighRisk && (
          <div className="bg-background rounded-lg border border-border p-4">
            <h2 className="text-[13px] font-semibold text-foreground mb-1">
              Submit to Police Dashboard
            </h2>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Help law enforcement track fraud patterns in your area by submitting
              this complaint to the shared Police Dashboard.
            </p>

            {submitStatus === "idle" && (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs"
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
                        message_text: data.simple_explanation
                          ? `${data.simple_explanation}`
                          : "(no explanation)",
                        risk_level: mapRiskLevel(data.risk_level),
                        crime_category: data.crime_category,
                        city: city,
                        pincode: pincode,
                        result_id: savedId,
                      }),
                    });
                    const json = (await res.json()) as { id?: string; error?: string };
                    if (!res.ok || json.error) throw new Error(json.error ?? "Failed to submit.");
                    setComplaintId(json.id ?? null);
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
              <div className="flex items-start gap-2.5 bg-[#10301F] border border-[#10301F] rounded-lg px-4 py-3">
                <CheckCircle className="h-4 w-4 text-[#4ADE80] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-semibold text-[#4ADE80] mb-0.5">
                    Complaint submitted successfully.
                  </p>
                  {complaintId && (
                    <p className="text-xs text-[#4ADE80]/80">
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
                <p className="text-xs text-[#FF6B6B] font-medium">{submitError}</p>
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
        {isHighRisk && city && (
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <NearbyPoliceStations city={city} pincode={pincode} />
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
          <Button
            size="sm"
            variant="outline"
            className="text-xs rounded-lg"
            onClick={copyVerdict}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs rounded-lg"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Fraud Check: ${mapRiskLevel(data.risk_level)}`,
                  text: `I verified a suspicious message. Result: ${mapRiskLevel(data.risk_level)} (${data.confidence}% confidence)`,
                }).catch(() => {});
              }
            }}
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share
          </Button>
          <Button
            size="sm"
            className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90 text-xs rounded-lg"
            onClick={onNewCheck}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            New Check
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Follow-up bubble ───────────────────────────────────────────────────────

function FollowupBubble({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  disabled,
}: {
  questions: string[];
  answers: string[];
  onAnswerChange: (idx: number, value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <AiBubble className="w-full max-w-[90%]">
      <p className="text-foreground mb-3">
        To give you an accurate verdict, I need a bit more context:
      </p>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i}>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {q}
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your answer…"
              value={answers[i] ?? ""}
              onChange={(e) => onAnswerChange(i, e.target.value)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold"
          onClick={onSubmit}
          disabled={disabled}
        >
          {disabled ? (
            <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Analyzing…</>
          ) : (
            "Submit Answers & Get Verdict"
          )}
        </Button>
      </div>
    </AiBubble>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Check() {
  const { addCheck } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greeting", kind: "ai-greeting" },
  ]);
  const [inputText, setInputText] = useState("");
  const [city, setCity] = useState<City | "">("");
  const [cityError, setCityError] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Follow-up state
  const [followupState, setFollowupState] = useState<{
    questions: string[];
    answers: string[];
    originalText: string;
  } | null>(null);

  // Audio
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const [audioError, setAudioError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Helpers ────────────────────────────────────────────────────────

  function addMsg(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
  }

  function removeTyping() {
    setMessages((prev) => prev.filter((m) => m.kind !== "ai-typing"));
  }

  const resetChat = () => {
    setMessages([{ id: "greeting", kind: "ai-greeting" }]);
    setFollowupState(null);
    setInputText("");
    setIsAnalyzing(false);
    setAudioStatus("idle");
    setAudioError(null);
    setCityError(false);
    setPincodeError(false);
  };

  // ── Audio recording ────────────────────────────────────────────────

  const transcribeBlob = useCallback(async (blob: Blob) => {
    setAudioStatus("transcribing");
    setAudioError(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Transcription failed.");
      }
      const { transcript } = (await res.json()) as { transcript: string };
      setInputText(transcript);
      setAudioStatus("idle");
      textareaRef.current?.focus();
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : "Transcription failed.");
      setAudioStatus("error");
    }
  }, []);

  const startRecording = useCallback(async () => {
    setAudioError(null);
    setAudioStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        transcribeBlob(blob);
      };
      mediaRecorder.start();
      setAudioStatus("recording");
    } catch {
      setAudioError("Microphone access denied. Please allow microphone access in your browser settings.");
      setAudioStatus("error");
    }
  }, [transcribeBlob]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const handleMicClick = () => {
    if (audioStatus === "recording") {
      stopRecording();
      return;
    }
    if (!city) {
      setCityError(true);
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeError(true);
      return;
    }
    if (audioStatus === "idle" || audioStatus === "error") {
      startRecording();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    transcribeBlob(file);
    e.target.value = "";
  };

  // ── Analysis ───────────────────────────────────────────────────────

  const runAnalysis = useCallback(
    async (
      originalText: string,
      followupQuestions: string[],
      followupAnswers: string[],
    ) => {
      setIsAnalyzing(true);
      removeTyping();
      addMsg({ id: uid(), kind: "ai-typing" });

      try {
        const body: Record<string, unknown> = { text: originalText };
        if (followupQuestions.length > 0) {
          body.follow_up_answers = followupQuestions.map(
            (q, i) => `Q: ${q}\nA: ${followupAnswers[i] ?? "(no answer)"}`,
          );
        }

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errData?.error ?? "Unable to analyze right now. Please try again.");
        }

        const data = (await response.json()) as
          | { mode: "need_more_info"; questions: string[] }
          | { mode: "final_verdict" } & FinalVerdictData;

        removeTyping();

        if (data.mode === "need_more_info") {
          addMsg({ id: uid(), kind: "ai-followup", questions: data.questions });
          setFollowupState({
            questions: data.questions,
            answers: new Array(data.questions.length).fill(""),
            originalText,
          });
        } else {
          const verdictData: FinalVerdictData = {
            risk_level: data.risk_level,
            confidence: data.confidence,
            crime_category: data.crime_category,
            reasons: data.reasons,
            recommended_actions: data.recommended_actions,
            simple_explanation: data.simple_explanation,
          };
          const savedId = addCheck({
            query: originalText,
            riskLevel: mapRiskLevel(verdictData.risk_level),
            confidenceScore: verdictData.confidence,
            reasons: verdictData.reasons,
            recommendedActions: verdictData.recommended_actions,
            simpleExplanation: verdictData.simple_explanation,
            city: city || undefined,
            crimeCategory: verdictData.crime_category,
            pincode: pincode || undefined,
          });
          addMsg({ id: uid(), kind: "ai-verdict", data: verdictData, savedId });
          setFollowupState(null);
        }
      } catch (err) {
        removeTyping();
        const message =
          err instanceof Error ? err.message : "Unable to analyze right now. Please try again.";
        addMsg({ id: uid(), kind: "ai-error", message });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [addCheck, city, pincode],
  );

  // ── Send handlers ──────────────────────────────────────────────────

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isAnalyzing || followupState !== null) return;
    if (!city) {
      setCityError(true);
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeError(true);
      return;
    }
    setCityError(false);
    setPincodeError(false);
    setInputText("");
    addMsg({ id: uid(), kind: "user-input", text });
    runAnalysis(text, [], []);
  };

  const handleFollowupSubmit = () => {
    if (!followupState || isAnalyzing) return;
    if (!city) {
      setCityError(true);
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeError(true);
      return;
    }
    setCityError(false);
    setPincodeError(false);
    addMsg({
      id: uid(),
      kind: "user-answers",
      pairs: followupState.questions.map((q, i) => ({
        question: q,
        answer: followupState.answers[i] ?? "(no answer)",
      })),
    });
    runAnalysis(
      followupState.originalText,
      followupState.questions,
      followupState.answers,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  const hasVerdict = messages.some((m) => m.kind === "ai-verdict");
  const inputDisabled = isAnalyzing || followupState !== null || hasVerdict;

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {/* ── Chat messages ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg) => {
            switch (msg.kind) {
              case "ai-greeting":
                return (
                  <AiBubble key={msg.id}>
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground mb-2">
                      <Shield className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                      Citizen Fraud Shield
                    </p>
                    Paste or describe a suspicious message, call, or email below and I'll analyze it for fraud
                    patterns immediately. You can also tap the mic icon to record or upload audio — it will
                    be transcribed automatically.
                  </AiBubble>
                );

              case "user-input":
                return (
                  <UserBubble key={msg.id}>{msg.text}</UserBubble>
                );

              case "ai-typing":
                return <TypingIndicator key={msg.id} />;

              case "ai-followup":
                return (
                  <FollowupBubble
                    key={msg.id}
                    questions={msg.questions}
                    answers={followupState?.answers ?? []}
                    onAnswerChange={(idx, val) => {
                      setFollowupState((prev) => {
                        if (!prev) return prev;
                        const updated = [...prev.answers];
                        updated[idx] = val;
                        return { ...prev, answers: updated };
                      });
                    }}
                    onSubmit={handleFollowupSubmit}
                    disabled={isAnalyzing}
                  />
                );

              case "user-answers":
                return (
                  <UserBubble key={msg.id}>
                    <div className="space-y-2">
                      {msg.pairs.map(({ question, answer }, i) => (
                        <div key={i}>
                          <p className="text-white/60 text-xs mb-0.5">{question}</p>
                          <p>{answer}</p>
                        </div>
                      ))}
                    </div>
                  </UserBubble>
                );

              case "ai-verdict":
                return (
                  <VerdictBubble
                    key={msg.id}
                    data={msg.data}
                    savedId={msg.savedId}
                    city={city || undefined}
                    pincode={pincode || undefined}
                    onNewCheck={resetChat}
                  />
                );

              case "ai-error":
                return (
                  <AiBubble key={msg.id}>
                    <p className="text-[#FF6B6B] font-medium mb-1">Analysis Failed</p>
                    <p className="text-muted-foreground">{msg.message}</p>
                    <button
                      className="mt-2 text-xs text-primary underline underline-offset-2"
                      onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
                    >
                      Dismiss
                    </button>
                  </AiBubble>
                );

              default:
                return null;
            }
          })}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Input bar (sticky bottom) ──────────────── */}
      {!hasVerdict && (
        <div className="bg-card border-t border-border sticky bottom-0">
          <div className="max-w-2xl mx-auto px-4 py-3 space-y-2.5">
            {/* City selector */}
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
              <label className="text-xs text-muted-foreground flex-shrink-0" htmlFor="city-select">
                Your city
              </label>
              <select
                id="city-select"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value as City | "");
                  if (e.target.value) setCityError(false);
                }}
                disabled={isAnalyzing}
                className={`text-xs text-foreground border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 ${
                  cityError ? "border-[#FF6B6B] ring-1 ring-[#FF6B6B]" : "border-border"
                }`}
              >
                <option value="" disabled>Select your city</option>
                {CITY_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {audioStatus === "transcribing" && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Transcribing…
                </span>
              )}
              {audioStatus === "recording" && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-[#FF6B6B] font-medium">
                  <span className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-pulse" />
                  Recording…
                </span>
              )}
              {audioError && (
                <span className="ml-auto text-xs text-[#FF6B6B]">{audioError}</span>
              )}
            </div>

            {/* Pincode field */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground flex-shrink-0 pl-5" htmlFor="pincode-input">
                Your pincode
              </label>
              <input
                id="pincode-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit PIN"
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPincode(val);
                  if (/^\d{6}$/.test(val)) setPincodeError(false);
                }}
                disabled={isAnalyzing}
                className={`w-28 text-xs text-foreground border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 ${
                  pincodeError ? "border-[#FF6B6B] ring-1 ring-[#FF6B6B]" : "border-border"
                }`}
              />
            </div>

            {/* Validation errors */}
            {cityError && (
              <p className="text-xs text-[#FF6B6B] font-medium -mt-1">
                Please select your city to continue.
              </p>
            )}
            {pincodeError && (
              <p className="text-xs text-[#FF6B6B] font-medium -mt-1">
                Please enter your 6-digit pincode.
              </p>
            )}

            {/* Message row */}
            <div className={`flex items-end gap-2 ${inputDisabled ? "opacity-60 pointer-events-none" : ""}`}>
              <div className="flex-1 border border-border rounded-lg bg-background overflow-hidden">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={
                    followupState
                      ? "Please answer the questions above first…"
                      : "Paste a message, describe a call…  (Enter to send)"
                  }
                  className="w-full resize-none px-3.5 py-2.5 text-sm text-foreground bg-transparent focus:outline-none leading-relaxed"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    // auto-grow
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={inputDisabled}
                  data-testid="textarea-fraud-content"
                />
              </div>

              {/* Mic / Stop button */}
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isAnalyzing || audioStatus === "transcribing"}
                className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                  audioStatus === "recording"
                    ? "border-[#FF6B6B] bg-[#3A1418] text-[#FF6B6B]"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={audioStatus === "recording" ? "Stop recording" : "Record audio"}
                data-testid="button-mic"
              >
                {audioStatus === "recording" ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : audioStatus === "transcribing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing || (audioStatus !== "idle" && audioStatus !== "error")}
                className="flex-shrink-0 w-9 h-9 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Upload audio file"
                data-testid="button-upload-audio"
              >
                <Upload className="h-4 w-4" strokeWidth={1.5} />
              </button>

              {/* Send button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || inputDisabled}
                className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send"
                data-testid="button-submit-analysis"
              >
                <Send className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
