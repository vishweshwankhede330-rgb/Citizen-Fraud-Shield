import { Shield, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "New Check", href: "/check" },
    { name: "My History", href: "/history" },
    { name: "My Complaints", href: "/my-complaints" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10"
      style={{ background: "linear-gradient(to right, #2C4A6B, #345A7F)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg border border-white/20 bg-white/10">
              <Shield className="h-4 w-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-base text-white">
              Citizen Fraud Shield
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-testid={`link-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`px-3.5 py-1.5 text-sm font-medium transition-colors rounded-lg ${
                    isActive
                      ? "text-white bg-white/15"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 focus:outline-none transition-colors"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
            data-testid="button-mobile-menu"
          >
            <span className="sr-only">Open main menu</span>
            {isOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10" id="mobile-menu">
          <div className="px-3 py-2 space-y-0.5">
            {navigation.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  data-testid={`link-mobile-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-white/15"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
