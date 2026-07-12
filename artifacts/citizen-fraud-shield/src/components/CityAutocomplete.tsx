import { useState, useRef, useEffect } from "react";

// Comprehensive list of major Indian cities and state capitals used for suggestions.
// Sorted to put starts-with matches first in the filter below.
const INDIAN_CITIES = [
  "Agartala", "Agra", "Ahmedabad", "Aizawl", "Allahabad", "Amritsar",
  "Aurangabad", "Bengaluru", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai",
  "Coimbatore", "Dehradun", "Delhi", "Dhanbad", "Faridabad", "Gandhinagar",
  "Ghaziabad", "Guwahati", "Gwalior", "Howrah", "Hubballi", "Hyderabad",
  "Imphal", "Indore", "Itanagar", "Jabalpur", "Jaipur", "Jodhpur", "Kanpur",
  "Kochi", "Kohima", "Kolkata", "Kota", "Lucknow", "Ludhiana", "Madurai",
  "Meerut", "Mumbai", "Mysuru", "Nagpur", "Nashik", "Navi Mumbai", "Panaji",
  "Patna", "Port Blair", "Prayagraj", "Puducherry", "Pune", "Raipur",
  "Rajkot", "Ranchi", "Shillong", "Shimla", "Solapur", "Srinagar", "Surat",
  "Thane", "Thiruvananthapuram", "Vadodara", "Varanasi", "Vijayawada",
  "Visakhapatnam",
];

const MAX_SUGGESTIONS = 7;

interface CityAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  disabled,
  hasError,
  id = "city-input",
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Starts-with matches first, then contains matches, deduplicated
  const suggestions =
    value.trim().length > 0
      ? (() => {
          const q = value.trim().toLowerCase();
          const startsWith = INDIAN_CITIES.filter((c) =>
            c.toLowerCase().startsWith(q),
          );
          const contains = INDIAN_CITIES.filter(
            (c) => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q),
          );
          return [...startsWith, ...contains].slice(0, MAX_SUGGESTIONS);
        })()
      : [];

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        placeholder="Type city…"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (value.trim().length > 0) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          } else if ((e.key === "Enter" || e.key === "Tab") && suggestions.length > 0) {
            // Only auto-select on Enter if the typed text isn't already an exact match
            if (value.trim().toLowerCase() !== suggestions[0].toLowerCase()) {
              e.preventDefault();
              onChange(suggestions[0]);
            }
            setOpen(false);
          }
        }}
        className={`w-32 text-xs text-foreground border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 transition-colors ${
          hasError
            ? "border-[#FF6B6B] ring-1 ring-[#FF6B6B]"
            : "border-border"
        }`}
      />

      {open && suggestions.length > 0 && (
        <ul
          className="absolute bottom-full mb-1 left-0 z-50 min-w-[176px] bg-card border border-border rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.3)] overflow-hidden py-1"
          role="listbox"
          aria-label="City suggestions"
        >
          {suggestions.map((city) => (
            <li
              key={city}
              role="option"
              aria-selected={city === value}
              className={`px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                city === value
                  ? "bg-primary/15 text-foreground font-medium"
                  : "text-foreground hover:bg-primary/10"
              }`}
              // Use onMouseDown to fire before the input's onBlur
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(city);
                setOpen(false);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
