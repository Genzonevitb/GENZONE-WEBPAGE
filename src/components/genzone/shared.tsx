import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export const accentText = { cyan: "text-cyan", pink: "text-pink", yellow: "text-yellow" } as const;
export const accentBg = { cyan: "bg-cyan", pink: "bg-pink", yellow: "bg-yellow" } as const;
export const accentBorder = { cyan: "border-cyan", pink: "border-pink", yellow: "border-yellow" } as const;

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SplitHeading({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.h2
      className={className}
      aria-label={text}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ staggerChildren: 0.07 }}
    >
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: "110%" }, show: { y: 0, transition: { duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] } } }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}

export function SectionTag({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-8 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
      <span className="text-cyan">{n}</span>
      <span className="h-px w-12 bg-border" />
      {label}
    </div>
  );
}
