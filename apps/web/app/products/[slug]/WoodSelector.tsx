"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface WoodSpecies {
  id: string;
  name: string;
  color: string;
  pattern: string;
  description: string;
}

const WOOD_OPTIONS: WoodSpecies[] = [
  {
    id: "oak",
    name: "بلوط ایرانی",
    color: "#d4b996",
    pattern: "رگه‌های درشت و مواج با استقامت فوق‌العاده",
    description: "چوبی با چگالی بالا، رنگ عسلی-کرم روشن و مقاومت بی‌نظیر در برابر ضربه.",
  },
  {
    id: "walnut",
    name: "گردوی آمریکایی",
    color: "#4e3629",
    pattern: "قهوه‌ای تیره شکلاتی با گره‌های پرپیچ‌وتاب",
    description: "پرفروش‌ترین چوب لوکس با بافت ابریشمی و پرداخت عمیق با روغن گیاهی.",
  },
  {
    id: "cherry",
    name: "گیلاس اصیل",
    color: "#8c4a32",
    pattern: "کهربایی مایل به سرخ، رگه‌های ظریف و یکدست",
    description: "چوبی با حس لمس بسیار گرم و آرام‌بخش که در گذر زمان پتینه‌ای غنی به خود می‌گیرد.",
  },
  {
    id: "mulberry",
    name: "توت کهنسال",
    color: "#a47935",
    pattern: "طلایی کاراملی با بافت بسیار متراکم و سنگین",
    description: "چوب بومی و تاریخی ایران با دوام چند ده‌ساله، متریال اصیل سازهای سنتی و مبلمان خاص.",
  },
];

export function WoodSelector({ initialWood }: { initialWood?: string }) {
  const defaultSpecies =
    WOOD_OPTIONS.find((w) => initialWood && initialWood.includes(w.name.split(" ")[0])) ??
    WOOD_OPTIONS[0];

  const [selected, setSelected] = useState<WoodSpecies>(defaultSpecies);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
          <span className="text-xs font-bold text-[var(--color-wood)]">
            شناخت و راهنمای گونه‌های چوب کارگاه
          </span>
        </div>
        <span className="text-xs font-semibold text-[var(--color-accent-strong)]">
          {selected.name}
        </span>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2.5" role="tablist" aria-label="راهنمای گونه‌های چوب طبیعی">
        {WOOD_OPTIONS.map((wood) => {
          const isSelected = selected.id === wood.id;
          return (
            <button
              key={wood.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelected(wood)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                isSelected
                  ? "border-[var(--color-wood)] bg-white text-[var(--color-wood)] shadow-xs ring-2 ring-[var(--color-wood)]/15"
                  : "border-[var(--color-border)] bg-white/70 text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-ink)]"
              }`}
            >
              <span
                className="h-4.5 w-4.5 shrink-0 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: wood.color }}
                aria-hidden
              />
              <span>{wood.name}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-soft)]">
        <strong className="text-[var(--color-wood)]">{selected.pattern}: </strong>
        {selected.description}
      </p>

      {initialWood && (
        <p className="mt-2 text-[11px] text-[var(--color-ink-mute)] border-t border-[var(--color-border)]/60 pt-2">
          گونه چوب این اثر: <strong className="text-[var(--color-wood)]">{initialWood}</strong>. برای سفارش با گونه‌های چوب دیگر یا ابعاد سفارشی، با کارگاه تماس بگیرید.
        </p>
      )}
    </div>
  );
}
