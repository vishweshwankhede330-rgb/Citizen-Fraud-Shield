import { useState, useEffect, useCallback } from "react";
import { ShieldAlert, LogOut, RefreshCw, Hash, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface DashboardComplaint {
  id: string;
  session_id: string;
  message_text: string;
  risk_level: string;
  crime_category: string | null;
  city: string | null;
  pincode: string | null;
  submitted_at: string;
}

function getRiskBadgeClass(level: string) {
  if (level === "High Risk") return "bg-[#3A1418] text-[#FF6B6B] border-[#3A1418]";
  if (level === "Low Risk") return "bg-[#10301F] text-[#4ADE80] border-[#10301F]";
  return "bg-[#3A2E0F] text-[#FFC857] border-[#3A2E0F]";
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
          {/* Header */}
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

          {/* Form */}
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

function Dashboard({ accessCode, onExit }: { accessCode: string; onExit: () => void }) {
  const [complaints, setComplaints] = useState<DashboardComplaint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [accessCode]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 py-8 md:py-12 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-foreground mb-1.5">
            Police Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            All fraud complaints submitted by citizens — sorted by most recent first.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="rounded-lg text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
            className="rounded-lg text-xs text-muted-foreground"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Exit Dashboard
          </Button>
        </div>
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
                    Submitted
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-background/50 transition-colors">
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
                      {formatDistanceToNow(new Date(c.submitted_at), {
                        addSuffix: true,
                      })}
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
              <li key={c.id} className="px-4 py-4 space-y-2">
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────

export default function PoliceDashboard() {
  const [accessCode, setAccessCode] = useState<string | null>(null);

  if (!accessCode) {
    return <AccessGate onAccess={setAccessCode} />;
  }

  return <Dashboard accessCode={accessCode} onExit={() => setAccessCode(null)} />;
}
