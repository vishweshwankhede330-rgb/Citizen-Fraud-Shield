import { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Shield } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-border py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-semibold text-sm">Citizen Fraud Shield</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            A public safety utility for identifying potential digital fraud. Not a replacement for official law enforcement advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
