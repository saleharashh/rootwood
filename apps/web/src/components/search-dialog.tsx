import React, { useState } from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSelect = (term: string) => {
    setLocation(`/products?search=${encodeURIComponent(term)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-label="جستجوی محصولات"
        aria-modal="true"
        className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-[var(--color-border)] animate-in fade-in slide-in-from-top-4"
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-[var(--color-ink-mute)] hover:bg-[var(--color-surface-2)]"
          aria-label="بستن پنجره جستجو"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="relative mt-2">
          <input
            type="search"
            role="searchbox"
            aria-label="جستجوی محصولات"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در نام قطعه، گونه چوب، میز، صندلی..."
            className="w-full rounded-2xl border-2 border-[var(--color-border)] pr-12 pl-4 py-3.5 text-base bg-[var(--color-surface-2)] focus:border-[var(--color-accent)] focus:bg-white focus:outline-hidden transition-all"
          />
          <Search className="absolute right-4 top-4 w-5 h-5 text-[var(--color-ink-mute)] pointer-events-none" />
        </form>

        <div className="mt-6">
          <h4 className="text-xs font-bold text-[var(--color-ink-mute)] mb-2.5">
            جستجوهای پرتکرار کارگاه:
          </h4>
          <div className="flex flex-wrap gap-2">
            {["میز ناهارخوری بلوط", "گردوی تیره", "کتابخانه", "صندلی ارگونومیک", "سینی پذیرایی", "گیلاس"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSelect(term)}
                className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-white text-xs font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-wood)] transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
