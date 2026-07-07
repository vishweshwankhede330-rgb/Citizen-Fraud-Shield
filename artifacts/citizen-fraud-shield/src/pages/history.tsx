import { Link } from "wouter";
import { useStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  History as HistoryIcon,
} from "lucide-react";
import { lazy, Suspense } from "react";

const FraudHotspotMap = lazy(() => import("@/components/FraudHotspotMap"));

export default function History() {
  const { history } = useStore();

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "High Risk":
        return <ShieldAlert className="h-4 w-4 text-[#B3261E]" strokeWidth={1.5} />;
      case "Low Risk":
        return <ShieldCheck className="h-4 w-4 text-[#2D6A4F]" strokeWidth={1.5} />;
      case "Uncertain":
        return <AlertTriangle className="h-4 w-4 text-[#946800]" strokeWidth={1.5} />;
      default:
        return null;
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "High Risk":
        return "bg-[#FDECEA] text-[#B3261E] border-[#f5c6c4]";
      case "Low Risk":
        return "bg-[#E8F3EC] text-[#2D6A4F] border-[#a8c8b5]";
      case "Uncertain":
        return "bg-[#FFF4E0] text-[#946800] border-[#f5de8a]";
      default:
        return "bg-background text-foreground border-border";
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 py-8 md:py-12 space-y-10">
      {/* Map */}
      <Suspense
        fallback={
          <div
            className="rounded-lg border border-border bg-white flex items-center justify-center"
            style={{ height: 420 }}
          >
            <p className="text-muted-foreground text-sm">Loading map…</p>
          </div>
        }
      >
        <FraudHotspotMap />
      </Suspense>

      {/* History list */}
      <div>
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold text-foreground mb-1.5">
            Verification History
          </h1>
          <p className="text-muted-foreground text-sm">
            Your previously checked messages and calls, stored on this device.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-background border border-border rounded-lg flex items-center justify-center">
                <HistoryIcon className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-[20px] font-semibold text-foreground mb-2">
              No history yet
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              You haven't run any verification checks. Start by checking a
              suspicious message or call.
            </p>
            <Link
              href="/check"
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
            >
              Run a Check
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <ul className="divide-y divide-border">
              {history.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/result/${item.id}`}
                    className="block hover:bg-background transition-colors"
                  >
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate mb-2">
                          {item.query}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getRiskBadgeColor(item.riskLevel)}`}
                          >
                            {getRiskIcon(item.riskLevel)}
                            {item.riskLevel}
                          </span>
                          {item.city && (
                            <span className="text-xs text-muted-foreground">
                              {item.city}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" strokeWidth={1.5} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
