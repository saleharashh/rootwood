import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  amount?: number;
}

/** Fades content in on first scroll into view using CSS only (no JS runtime). */
export function Reveal({ children, className, delay = 0, y = 22, amount = 0.15 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: amount }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [amount]);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " reveal-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ transitionDelay: `${delay}s`, ["--reveal-y" as string]: `${y}px` }}
    >
      {children}
    </div>
  );
}
