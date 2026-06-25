/**
 * Onboarding Components
 *
 * 4-Step Onboarding Flow:
 * 1. WelcomeStep - Use case selection (Personal/Work/Business)
 * 2. ProfileStep - Industry, Department, Company Size
 * 3. GoalsStep - Goals & Workspace creation
 * 4. ConnectorsStep - Data source selection with Flow A/B/C classification
 */

export { OnboardingFlow } from "./OnboardingFlow";
export { WelcomeStep } from "./steps/WelcomeStep";
export { ProfileStep } from "./steps/ProfileStep";
export { GoalsStep } from "./steps/GoalsStep";
export { ConnectorsStep, type ConnectorSelection } from "./steps/ConnectorsStep";
export { AILoader } from "./AILoader";
export { WorkplaceLoading } from "./WorkplaceLoading";
