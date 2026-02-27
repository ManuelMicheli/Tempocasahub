'use client';

import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

// Provider — wraps with LazyMotion + domAnimation (~17KB gzip vs 33KB full)
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

// Respect prefers-reduced-motion
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

// PageTransition — fade+slide 200ms per pagine
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  if (prefersReducedMotion) return <div className={className}>{children}</div>;
  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// StaggerContainer — orchestrates staggered reveals
export function StaggerContainer({
  children,
  className,
  delay = 0,
  staggerDelay = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}) {
  if (prefersReducedMotion) return <div className={className}>{children}</div>;
  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// StaggerItem — individual item in a stagger sequence
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (prefersReducedMotion) return <div className={className}>{children}</div>;
  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// HoverScale — scale(1.015) on hover, scale(0.98) on tap
export const HoverScale = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { children: React.ReactNode; className?: string }
>(function HoverScale({ children, className, ...props }, ref) {
  if (prefersReducedMotion) return <div ref={ref} className={className}>{children}</div>;
  return (
    <m.div
      ref={ref}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
      {...props}
    >
      {children}
    </m.div>
  );
});

// Dialog/modal spring physics props
export const dialogMotionProps = prefersReducedMotion
  ? {}
  : {
      initial: { opacity: 0, scale: 0.96, y: 8 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.96, y: 8 },
      transition: { type: 'spring' as const, stiffness: 350, damping: 30 },
    };

// Re-export for convenience
export { m, AnimatePresence };
