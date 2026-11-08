"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { formatCount } from "@/lib/price";
import { ChevronRight, ChevronLeft, Image as ImageIcon } from "lucide-react";

interface ProductGalleryProps {
  images: Product["images"];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-xs">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[var(--color-surface-2)] text-[var(--color-ink-mute)]">
          <ImageIcon className="h-12 w-12 opacity-35" aria-hidden="true" />
          <span className="sr-only">تصویری برای {productName} موجود نیست</span>
        </div>
      </div>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0];

  function showPrevious() {
    setSelectedIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setSelectedIndex((current) => (current + 1) % images.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      showNext();
    } else if (diff < -45) {
      showPrevious();
    }
    setTouchStartX(null);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-2.5 shadow-xs">
        <div
          className="relative aspect-square overflow-hidden rounded-xl bg-[#eee7dd] touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            key={selectedImage.url}
            src={selectedImage.url}
            alt={selectedImage.alt ?? productName}
            fill
            className="animate-reveal object-cover transition-opacity duration-300"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute start-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-white/95 text-[var(--color-wood)] shadow-sm transition-all hover:bg-white hover:scale-105 active:scale-95"
                aria-label="تصویر قبلی"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute end-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-white/95 text-[var(--color-wood)] shadow-sm transition-all hover:bg-white hover:scale-105 active:scale-95"
                aria-label="تصویر بعدی"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="absolute bottom-3 start-3 rounded-md border border-[var(--color-border)] bg-white/90 px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)] backdrop-blur-xs shadow-xs">
                {formatCount(selectedIndex + 1)} / {formatCount(images.length)}
              </span>
            </>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex overflow-x-auto gap-2.5 no-scrollbar pb-1 sm:grid sm:grid-cols-4" role="group" aria-label="انتخاب تصویر محصول">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`group relative h-18 w-18 shrink-0 sm:h-auto sm:w-auto aspect-square cursor-pointer overflow-hidden rounded-xl border bg-white outline-none transition-all active:scale-95 ${
                index === selectedIndex
                  ? "border-[var(--color-wood)] ring-2 ring-[var(--color-wood)]/20"
                  : "border-[var(--color-border)] opacity-70 hover:opacity-100 hover:border-[var(--color-accent)]"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt ?? `${productName} — تصویر ${formatCount(index + 1)}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 25vw, 12vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
