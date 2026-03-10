"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  onClick?: () => void;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  onClick?: never;
}

export type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  /** Controlled active index — pass null to deselect all */
  activeIndex?: number | null;
  onChange?: (index: number | null) => void;
}

const buttonVariants = {
  initial: { gap: 0, paddingLeft: ".5rem", paddingRight: ".5rem" },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring" as const, bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeIndex,
  onChange,
}: ExpandableTabsProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isControlled = activeIndex !== undefined;

  // Close on outside click only in uncontrolled mode
  React.useEffect(() => {
    if (isControlled) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onChange?.(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isControlled, onChange]);

  const handleSelect = (index: number, tab: Tab) => {
    tab.onClick?.();
    onChange?.(index);
  };

  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-0.5 rounded-xl p-1", className)}
      style={{
        background: "rgba(26,30,36,0.5)",
        border: "1px solid rgba(223,208,184,0.07)",
        backdropFilter: "blur(16px)",
      }}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return (
            <div
              key={`sep-${index}`}
              className="mx-1 h-4 w-px flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.08)" }}
              aria-hidden="true"
            />
          );
        }

        const Icon = tab.icon;
        const isSelected = activeIndex === index;

        return (
          <motion.button
            key={tab.title}
            title={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(index, tab)}
            transition={transition}
            className="relative flex items-center rounded-lg text-sm font-medium py-1.5 cursor-pointer flex-shrink-0"
            style={{
              background: isSelected ? "rgba(223,208,184,0.10)" : "transparent",
              color: isSelected ? "#DFD0B8" : "rgba(255,255,255,0.38)",
              border: isSelected
                ? "1px solid rgba(223,208,184,0.18)"
                : "1px solid transparent",
              transition: "color 0.2s ease, background 0.2s ease, border-color 0.2s ease",
            }}
          >
            <Icon size={15} strokeWidth={1.8} />
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap text-xs"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
