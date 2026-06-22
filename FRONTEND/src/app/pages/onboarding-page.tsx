import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/auth-context";
import { OnboardingFlow } from "../components/onboarding/onboarding-flow";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasCompletedOnboarding, completeOnboarding } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (hasCompletedOnboarding) {
      navigate("/workspace");
    }
  }, [isAuthenticated, hasCompletedOnboarding, navigate]);

  const handleComplete = (data: any) => {
    completeOnboarding(data);
    navigate("/workspace");
  };

  if (!isAuthenticated || hasCompletedOnboarding) {
    return null;
  }

  return <OnboardingFlow onComplete={handleComplete} />;
}