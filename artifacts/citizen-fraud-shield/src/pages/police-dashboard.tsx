import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  LogOut,
  RefreshCw,
  Hash,
  MapPin,
  Calendar,
  Phone,
  X,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";

interface DashboardComplaint {
  id: string;
  session_id: string;
  message_text: string;
  risk_level: string;
  crime_category: string | null;
  city: string | null;
  pincode: string | null;
  phone_number: string | null;
  submitted_at: string;
}

function getRiskBadgeClass(level: string) {
  if (level === "High Risk") return "bg-[#3A1418] text-[#FF6B6B] border-[#3A1418]";
  if (level === "Low Risk") return "bg-[#10301F] text-[#4ADE80] border-[#10301F]";
  return "bg-[#3A2E0F] text-[#FFC857] border-[#3A2E0F]";
}

// ── Complaint detail modal ─────────────────────────────────────────────────

function ComplaintDetail({
  complaint,
  onClose,
}: {
  complaint: DashboardComplaint;
  onClose: () => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 py-8 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-card">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getRiskBadgeClass(complaint.risk_level)}`}
            >
              {complaint.risk_level}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {complaint.id.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-5">

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-lg border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Crime Category</p>
              <p className="text-sm font-medium text-foreground">
                {complaint.crime_category ?? <span className="text-muted-foreground italic">Not categorised</span>}
              </p>
            </div>
            <div className="bg-background rounded-lg border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Submitted</p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(complaint.submitted_at), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
            <div className="bg-background rounded-lg border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                Location
              </p>
              <p className="text-sm font-medium text-foreground">
                {[complaint.city, complaint.pincode].filter(Boolean).join(" · ") || (
                  <span className="text-muted-foreground italic">Not provided</span>
                )}
              </p>
            </div>
            <div className="bg-background rounded-lg border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3" strokeWidth={1.5} />
                Contact Number
              </p>
              <p className="text-sm font-medium text-foreground">
                {complaint.phone_number ?? (
                  <span className="text-muted-foreground italic">Not provided</span>
                )}
              </p>
            </div>
          </div>

          {/* Full message */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Full Message / Transcript
            </p>
            <div className="bg-background border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
              {complaint.message_text}
            </div>
          </div>

          {/* Session ID (for investigation reference) */}
          <div className="bg-background border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Session Reference</p>
            <p className="text-xs font-mono text-muted-foreground break-all">
              {complaint.session_id}
            </p>
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-lg text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Access gate ───────────────────────────────────────────────────────────

function AccessGate({ onAccess }: { onAccess: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/complaints/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        onAccess(code.trim());
      } else {
        setError(data.error ?? "Incorrect access code. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 space-y-6 shadow-card">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-[#4A9EFF]/10 border border-[#4A9EFF]/20 rounded-lg flex items-center justify-center">
                <ShieldAlert className="h-7 w-7 text-[#4A9EFF]" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-[22px] font-semibold text-foreground">
              Police Dashboard
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter your access code to view submitted fraud complaints.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="access-code"
                className="block text-xs font-medium text-muted-foreground mb-1.5"
              >
                Police Access Code
              </label>
              <input
                id="access-code"
                type="password"
                autoComplete="off"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="Enter access code"
                className={`w-full text-sm border rounded-lg px-3.5 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  error ? "border-[#FF6B6B]" : "border-border"
                }`}
              />
              {error && (
                <p className="mt-1.5 text-xs text-[#FF6B6B] font-medium">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={!code.trim() || loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              {loading ? "Verifying…" : "Access Dashboard"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard view ────────────────────────────────────────────────────────

function Dashboard({
  accessCode,
  loading,
  onLoadingChange,
  reloadTrigger,
}: {
  accessCode: string;
  loading: boolean;
  onLoadingChange: (v: boolean) => void;
  reloadTrigger: number;
}) {
  const [complaints, setComplaints] = useState<DashboardComplaint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<DashboardComplaint | null>(null);

  const load = useCallback(async () => {
    onLoadingChange(true);
    setError(null);
    try {
      const res = await fetch("/api/complaints/all", {
        headers: { Authorization: `Bearer ${accessCode}` },
      });
      if (res.status === 401) {
        setError("Access denied. Please exit and re-enter the access code.");
        setComplaints(null);
        return;
      }
      const data = (await res.json()) as {
        complaints?: DashboardComplaint[];
        error?: string;
      };
      if (data.error) throw new Error(data.error);
      setComplaints(data.complaints ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load complaints.");
    } finally {
      onLoadingChange(false);
    }
  }, [accessCode, onLoadingChange]);

  useEffect(() => { void load(); }, [load, reloadTrigger]);

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 py-8 md:py-12 space-y-6">

      {/* Page title + subtitle */}
      <div>
        <h1 className="text-[26px] font-semibold text-foreground mb-1">
          Complaints
        </h1>
        <p className="text-muted-foreground text-sm">
          All fraud complaints submitted by citizens — sorted by most recent first.
          Click any row to view full details.
        </p>
      </div>

      {/* Stats bar */}
      {complaints !== null && (
        <div className="bg-[#4A9EFF]/10 border border-[#4A9EFF]/20 text-foreground rounded-lg px-5 py-3.5 flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total Complaints</p>
            <p className="text-2xl font-semibold text-foreground">{complaints.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">High Risk</p>
            <p className="text-2xl font-semibold text-[#FF6B6B]">
              {complaints.filter((c) => c.risk_level === "High Risk").length}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-gradient-to-b from-[#3A1418] to-[#2A0F12] border border-[#3A1418] rounded-lg p-4">
          <p className="text-sm text-[#FF6B6B] font-medium">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && complaints === null && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading complaints…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && complaints !== null && complaints.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No complaints have been submitted yet.
          </p>
        </div>
      )}

      {/* Complaints table */}
      {complaints !== null && complaints.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Complaint ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Risk
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Location
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Submitted
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-background/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedComplaint(c)}
                    title="Click to view full details"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {c.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getRiskBadgeClass(c.risk_level)}`}
                      >
                        {c.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px]">
                      {c.crime_category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {[c.city, c.pincode].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {c.phone_number ?? (
                        <span className="italic text-muted-foreground/50">Not provided</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(c.submitted_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">{c.message_text}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-border">
            {complaints.map((c) => (
              <li
                key={c.id}
                className="px-4 py-4 space-y-2 cursor-pointer hover:bg-background/70 transition-colors active:bg-background"
                onClick={() => setSelectedComplaint(c)}
              >
                <div className="flex items-start gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getRiskBadgeClass(c.risk_level)}`}
                  >
                    <ShieldAlert className="h-3 w-3" strokeWidth={1.5} />
                    {c.risk_level}
                  </span>
                  {c.crime_category && (
                    <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border">
                      {c.crime_category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                  {c.message_text}
                </p>
                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" strokeWidth={1.5} />
                    <span className="font-mono">{c.id.slice(0, 8).toUpperCase()}</span>
                  </span>
                  {(c.city || c.pincode) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" strokeWidth={1.5} />
                      {[c.city, c.pincode].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" strokeWidth={1.5} />
                    {formatDistanceToNow(new Date(c.submitted_at), { addSuffix: true })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" strokeWidth={1.5} />
                    {c.phone_number ?? (
                      <span className="italic text-muted-foreground/50">Not provided</span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-[#4A9EFF]">Tap to view full details →</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detail modal */}
      {selectedComplaint && (
        <ComplaintDetail
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}

// ── Page root — self-contained, no citizen Layout ─────────────────────────

export default function PoliceDashboard() {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">

      {/* Police-specific sticky header — no citizen nav links */}
      <header
        className="sticky top-0 z-40 border-b border-border"
        style={{ background: "linear-gradient(to right, #0F1419, #1A2332)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg border border-white/20 bg-white/10">
                <Shield className="h-4 w-4 text-white" strokeWidth={1.5} />
              </div>
              <span className="font-semibold text-sm text-white">
                Citizen Fraud Shield
                <span className="text-white/50 mx-1.5">—</span>
                Police Dashboard
              </span>
            </div>

            {/* Action buttons — only shown when authenticated */}
            {accessCode && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => setReloadTrigger((t) => t + 1)}
                  className="rounded-lg text-xs border-white/20 text-white/80 hover:text-white hover:bg-white/10 bg-transparent"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAccessCode(null)}
                  className="rounded-lg text-xs border-white/20 text-white/70 hover:text-white hover:bg-white/10 bg-transparent"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Exit Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page body */}
      <main className="flex-1 flex flex-col">
        {!accessCode ? (
          <AccessGate onAccess={setAccessCode} />
        ) : (
          <Dashboard
            accessCode={accessCode}
            loading={loading}
            onLoadingChange={setLoading}
            reloadTrigger={reloadTrigger}
          />
        )}
      </main>
    </div>
  );
}
