/**
 * Animated Content Router
 *
 * Wraps the Content Router with Framer Motion animations for smooth view transitions.
 * Uses the motion components from @/components/common/motion for consistent animations.
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ContentRouter } from "./content-router";
import type { Domain } from "./workspace-config";
import type { ModuleData } from "./data-density-scorer";

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

interface AnimatedContentRouterProps {
  domain: Domain;
  moduleId: string;
  forceRender?: boolean;
  dataContext?: ModuleData;
  userRole?: string;
  projectedModules?: Array<{ id: string; path: string }>;
  fullLayers?: boolean;
}

export function AnimatedContentRouter({
  domain,
  moduleId,
  forceRender,
  dataContext,
  userRole,
  projectedModules,
  fullLayers = false,
}: AnimatedContentRouterProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${domain}-${moduleId}`}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="h-full"
      >
        <ContentRouter
          domain={domain}
          moduleId={moduleId}
          forceRender={forceRender}
          dataContext={dataContext}
          userRole={userRole}
          projectedModules={projectedModules}
          fullLayers={fullLayers}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Staggered list animation wrapper for lists within views
interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className, staggerDelay = 0.05 }: StaggeredListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual list item animation
interface ListItemProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: ListItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
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
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Card hover animation wrapper
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedCard({ children, className, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 20 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

// Fade-in section wrapper
interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FadeInSection({ children, className, delay = 0 }: FadeInSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide-in from side animation
interface SlideInProps {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right" | "bottom" | "top";
  delay?: number;
}

export function SlideIn({ children, className, direction = "right", delay = 0 }: SlideInProps) {
  const directionMap = {
    left: { x: -60, y: 0 },
    right: { x: 60, y: 0 },
    top: { x: 0, y: -60 },
    bottom: { x: 0, y: 60 },
  };

  const initial = directionMap[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...initial }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale-in animation for modals, dialogs, etc.
interface ScaleInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ScaleIn({ children, className, delay = 0 }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Pulse animation for attention indicators
interface PulseProps {
  children: React.ReactNode;
  className?: string;
}

export function Pulse({ children, className }: PulseProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Hover scale animation for interactive elements
interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function HoverScale({ children, className, scale = 1.05 }: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated number counter
interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, className, duration = 1 }: AnimatedNumberProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
}

// Staggered grid animation
interface AnimatedGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
}

export function AnimatedGrid({ children, className, columns = 3 }: AnimatedGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "1rem",
      }}
    >
      {children}
    </motion.div>
  );
}

// Grid item animation
interface GridItemProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGridItem({ children, className }: GridItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 15,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
