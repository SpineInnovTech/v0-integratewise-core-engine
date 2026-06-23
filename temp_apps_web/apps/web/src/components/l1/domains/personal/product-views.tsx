/**
 * Personal Space Product Views — Adaptive wrappers
 *
 * Products with dedicated views (keep their custom components):
 *   - LifeOps → knowledge-hub-view, founder-today-view
 *
 * Products using generic adaptive renderer:
 *   - WealthPilot, WellnessCore, LearningDesk, RelationshipMap
 */
import React from "react";
import { ProductView } from "@/components/l1/views/product-view";

export function WealthPilotView() {
  return (
    <ProductView
      productId="wealth_pilot"
      title="WealthPilot"
      subtitle="Personal finance tracking, budgeting, investment visibility"
    />
  );
}

export function WellnessCoreView() {
  return (
    <ProductView
      productId="wellness_core"
      title="WellnessCore"
      subtitle="Health metrics, fitness tracking, wellness routine management"
    />
  );
}

export function LearningDeskView() {
  return (
    <ProductView
      productId="learning_desk"
      title="LearningDesk"
      subtitle="Courses, reading, certifications, skill development"
    />
  );
}

export function RelationshipMapView() {
  return (
    <ProductView
      productId="relationship_map"
      title="RelationshipMap"
      subtitle="Personal CRM, network management, follow-up tracking"
    />
  );
}
