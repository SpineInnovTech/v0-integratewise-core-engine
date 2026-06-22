import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/auth-context";
import { LoginPage } from "../components/auth/login-page";
import { SignUpPage } from "../components/auth/signup-page";
import { ForgotPasswordPage } from "../components/auth/forgot-password-page";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, isAuthenticated, hasCompletedOnboarding } = useAuth();
  
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  // Determine which auth screen to show based on route
  const pathname = location.pathname;
  const isLogin = pathname === "/" || pathname === "/login" || pathname === "/auth/login";
  const isSignup = pathname === "/signup" || pathname === "/auth/signup";
  const isForgotPassword = pathname === "/forgot-password" || pathname === "/auth/forgot-password";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (hasCompletedOnboarding) {
        navigate("/workspace");
      } else {
        navigate("/onboarding");
      }
    }
  }, [isAuthenticated, hasCompletedOnboarding, navigate]);

  // Redirect to login if no valid auth route
  useEffect(() => {
    if (!isLogin && !isSignup && !isForgotPassword) {
      navigate("/login", { replace: true });
    }
  }, [isLogin, isSignup, isForgotPassword, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(undefined);
      setLoading(true);
      await login(email, password);
      // Navigation happens in useEffect after auth state updates
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (name: string, email: string, password: string, company: string) => {
    try {
      setError(undefined);
      setLoading(true);
      await signup(email, password, name);
      // Navigation happens in useEffect after auth state updates
    } catch (err) {
      setError("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      setError(undefined);
      setLoading(true);
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Password reset link sent to ${email}`);
      navigate("/login");
    } catch (err) {
      setError("Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  if (isLogin) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignUp={() => navigate("/signup")}
        onForgotPassword={() => navigate("/forgot-password")}
        error={error}
        loading={loading}
      />
    );
  }

  if (isSignup) {
    return (
      <SignUpPage
        onSignUp={handleSignup}
        onBackToLogin={() => navigate("/login")}
        error={error}
        loading={loading}
      />
    );
  }

  if (isForgotPassword) {
    return (
      <ForgotPasswordPage
        onSubmit={handleForgotPassword}
        onBackToLogin={() => navigate("/login")}
        loading={loading}
      />
    );
  }

  // If no valid route matched, return login page (useEffect will handle redirect)
  return (
    <LoginPage
      onLogin={handleLogin}
      onSignUp={() => navigate("/signup")}
      onForgotPassword={() => navigate("/forgot-password")}
      error={error}
      loading={loading}
    />
  );
}