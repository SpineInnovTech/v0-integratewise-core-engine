import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

export type AnimateInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  scale?: number;
  once?: boolean;
  amount?: number;
};

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.7,
  y = 30,
  x = 0,
  scale = 1,
  once = true,
  amount = 0.3,
}: AnimateInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, x, scale }}
      animate={isInView ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInSpring({
  children,
  className,
  delay = 0,
  y = 40,
  x = 0,
  once = true,
  amount = 0.2,
}: AnimateInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, x }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 20,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export type StaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
  amount?: number;
};

export function StaggerChildren({
  children,
  className,
  stagger = 0.08,
  once = true,
  amount = 0.2,
}: StaggerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 18,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  once = true,
  amount = 0.3,
}: AnimateInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({
  children,
  className,
  delay = 0,
  once = true,
  amount = 0.2,
}: AnimateInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
