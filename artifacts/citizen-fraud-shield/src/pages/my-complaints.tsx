import { useState, useEffect } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { getSessionId } from "@/lib/session";
import {
  ShieldAlert,
  ClipboardList,
  MapPin,
  Calendar,
  Hash,
} from "lucide-react";

interface Complaint {
  id: string;
  risk_level: string;
  crime_category: string | null;
  city: string | null;
  pincode: string | null;
  submitted_at: string;
  message_text: string;
}

function getRiskBadgeClass(level: string) {
  if (level === "High Risk") return "bg-[#FDECEA] text-[#B3261E] border-[#f5c6c4]";
  if (level === "Low Risk") return "bg-[#E8F3EC] text-[#2D6A4F] border-[#a8c8b5]";
  return "bg-[#FFF4E0] text-[#946800] border-[#f5de8a]";
}

export default function MyComplaints() {
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`/api/complaints/mine?session=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data: { complaints?: Complaint[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setComplaints(data.complaints ?? []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load complaints.");
      });
  }, []);

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 py-8 md:py-12 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold text-foreground mb-1.5">
          My Complaints
        </h1>
        <p className="text-muted-foreground text-sm">
          Complaints you have submitted to the Police Dashboard from this browser.
        </p>
      </div>

      {/* Loading */}
      {complaints === null && !error && (
        <div className="bg-white border border-border rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading your complaints…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#FDECEA] border border-[#f5c6c4] rounded-lg p-5">
          <p className="text-sm text-[#B3261E] font-medium">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {complaints !== null && complaints.length === 0 && (
        <div className="bg-white border border-border rounded-lg p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-background border border-border rounded-lg flex items-center justify-center">
              <ClipboardList className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-[20px] font-semibold text-foreground mb-2">
            No complaints yet
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            When you submit a complaint from a High Risk result screen, it will appear here.
          </p>
          <Link
            href="/check"
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
          >
            Run a Check
          </Link>
        </div>
      )}

      {/* Complaints list */}
      {complaints !== null && complaints.length > 0 && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <ul className="divide-y divide-border">
            {complaints.map((c) => (
              <li key={c.id} className="px-5 py-4 space-y-2">
                {/* Top row: risk badge + category */}
                <div className="flex items-start gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getRiskBadgeClass(c.risk_level)}`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {c.risk_level}
                  </span>
                  {c.crime_category && (
                    <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border">
                      {c.crime_category}
                    </span>
                  )}
                </div>

                {/* Message preview */}
                <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                  {c.message_text}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
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
