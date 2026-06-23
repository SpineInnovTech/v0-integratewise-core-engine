import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Link, Redirect, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { IntegrateWiseLogoHorizontal } from "@/components/integratewise-logo";
import { Button } from "@/components/ui/button";

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var, leave
// publishableKey undefined, or replace publishableKeyFromHost with anything else.
export const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV — the empty dev value is
// intentional, and any branching breaks the prod proxy.
export const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's setLocation
// prepends the base — strip it to avoid doubling.
export function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#3F3182",
    colorForeground: "#0F172A",
    colorMutedForeground: "#64748B",
    colorDanger: "#DC2626",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#0F172A",
    colorNeutral: "#E2E8F0",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    main: "gap-5",
    headerTitle: "text-slate-900 text-xl font-semibold",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButton:
      "border border-slate-200 hover:bg-slate-50 transition-colors",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    dividerLine: "bg-slate-200",
    dividerText: "text-slate-400",
    formFieldLabel: "text-slate-700 font-medium",
    formFieldInput:
      "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#3F3182] focus:ring-1 focus:ring-[#3F3182]",
    formButtonPrimary:
      "bg-[#3F3182] hover:bg-[#352a6e] text-white font-semibold normal-case",
    otpCodeFieldInput: "border border-slate-200 text-slate-900",
    identityPreviewEditButton: "text-[#3F3182] hover:text-[#352a6e]",
    formFieldSuccessText: "text-emerald-600",
    formFieldErrorText: "text-[#DC2626]",
    alert: "border border-slate-200",
    alertText: "text-slate-700",
    footerAction: "justify-center",
    footerActionText: "text-slate-500",
    footerActionLink: "text-[#3F3182] hover:text-[#352a6e] font-medium",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-auto",
  },
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in to your IntegrateWise OS workspace",
    },
  },
  signUp: {
    start: {
      title: "Create your account",
      subtitle: "Get access to IntegrateWise OS",
    },
  },
};

export function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

// Wraps a page so only signed-in users can reach it; signed-out users are sent to
// sign-in. Props (including wouter route params) pass straight through.
export function withAuth(Component: ComponentType<any>) {
  return function Guarded(props: any) {
    return (
      <>
        <Show when="signed-in">
          <Component {...props} />
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </>
    );
  };
}

// Public landing shown at the base path for signed-out users (per Clerk home-route
// rule — never auto-redirect the base path to sign-in).
export function Landing() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted px-6 text-center">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <IntegrateWiseLogoHorizontal className="h-11 w-auto" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            IntegrateWise OS
          </h1>
          <p className="text-base text-muted-foreground">
            The internal operations command center — CRM, pipeline, tasks,
            metrics, and knowledge in one governed workspace.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/sign-in">
            <Button size="lg" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Create account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Clears the React Query cache when the signed-in user changes so cached data from
// a previous session never bleeds across accounts.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

// Mounts ClerkProvider with wouter-aware navigation. Must render inside
// <WouterRouter> (uses useLocation) and inside a QueryClientProvider.
export function ClerkAppProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={clerkLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      {children}
    </ClerkProvider>
  );
}
