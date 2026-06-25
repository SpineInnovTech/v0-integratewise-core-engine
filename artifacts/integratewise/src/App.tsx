import { Switch, Route, Router as WouterRouter, useParams } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import { PlatformProvider } from "@/platform/platform-context";
import { SpineProvider } from "@/spine/spine-context";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { ModuleHost } from "@/components/workspace/module-host";
import { RoleDashboard } from "@/components/workspace/role-dashboard";
import { TwinPage } from "@/components/twin-ui/twin-page";

import { LeadDetailView } from "@/components/views/lead-detail-view";
import { ClientDetailView } from "@/components/views/client-detail-view";

// Auth pages render bare (outside the persistent shell)
import AuthLoginPage from "@/pages/auth/login/index";
import AuthSignUpPage from "@/pages/auth/sign-up/index";
import AuthSignUpSuccessPage from "@/pages/auth/sign-up-success/index";
import AuthErrorPage from "@/pages/auth/error/index";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing/index";
import PricingPage from "@/pages/pricing/index";
import { CommandCenterView } from "@/components/views/command-center-view";

const queryClient = new QueryClient();

function LeadDetailRoute() {
  const { id } = useParams<{ id: string }>();
  return <ModuleHost id="leads" view={LeadDetailView} leadId={id || ""} />;
}

function ClientDetailRoute() {
  const { id } = useParams<{ id: string }>();
  return <ModuleHost id="clients" view={ClientDetailView} clientId={id || ""} />;
}

function KnowledgeCategoryRoute() {
  const { category } = useParams<{ category: string }>();
  return <ModuleHost id="knowledge" category={category || ""} />;
}

/** Routes rendered inside the persistent workspace shell. */
function WorkspaceRoutes() {
  return (
    <Switch>
      <Route path="/" component={CommandCenterView} />
      <Route path="/command-center" component={CommandCenterView} />
      <Route path="/cockpit" component={() => <ModuleHost id="cockpit" />} />
      <Route path="/iq-hub" component={() => <ModuleHost id="iq-hub" />} />
      <Route path="/governance" component={() => <ModuleHost id="governance" />} />
      <Route path="/cs-accounts" component={() => <ModuleHost id="cs-accounts" />} />
      <Route path="/cs-contacts" component={() => <ModuleHost id="cs-contacts" />} />
      <Route path="/cs-meetings" component={() => <ModuleHost id="cs-meetings" />} />
      <Route path="/release-control" component={() => <ModuleHost id="release-control" />} />
      <Route path="/insights" component={() => <ModuleHost id="insights" />} />
      <Route path="/loader" component={() => <ModuleHost id="loader" />} />
      <Route path="/profile" component={() => <ModuleHost id="profile" />} />
      <Route path="/spend-insights" component={() => <ModuleHost id="spend-insights" />} />
      <Route path="/today" component={() => <ModuleHost id="today" />} />
      <Route path="/twin" component={TwinPage} />
      <Route path="/context" component={() => <ModuleHost id="context" />} />
      <Route path="/email" component={() => <ModuleHost id="email" />} />
      <Route path="/leads/:id" component={LeadDetailRoute} />
      <Route path="/leads" component={() => <ModuleHost id="leads" />} />
      <Route path="/pipeline" component={() => <ModuleHost id="pipeline" />} />
      <Route path="/deals" component={() => <ModuleHost id="deals" />} />
      <Route path="/sales" component={() => <ModuleHost id="sales" />} />
      <Route path="/campaigns" component={() => <ModuleHost id="campaigns" />} />
      <Route path="/content" component={() => <ModuleHost id="content" />} />
      <Route path="/clients/:id" component={ClientDetailRoute} />
      <Route path="/clients" component={() => <ModuleHost id="clients" />} />
      <Route path="/sessions" component={() => <ModuleHost id="sessions" />} />
      <Route path="/projects" component={() => <ModuleHost id="projects" />} />
      <Route path="/tasks" component={() => <ModuleHost id="tasks" />} />
      <Route path="/products" component={() => <ModuleHost id="products" />} />
      <Route path="/services" component={() => <ModuleHost id="services" />} />
      <Route path="/knowledge/:category" component={KnowledgeCategoryRoute} />
      <Route path="/knowledge" component={() => <ModuleHost id="knowledge" />} />
      <Route path="/metrics" component={() => <ModuleHost id="metrics" />} />
      <Route path="/strategy" component={() => <ModuleHost id="strategy" />} />
      <Route path="/brainstorming" component={() => <ModuleHost id="brainstorming" />} />
      <Route path="/architecture" component={() => <ModuleHost id="architecture" />} />
      <Route path="/data-flow" component={() => <ModuleHost id="data-flow" />} />
      <Route path="/data-sources" component={() => <ModuleHost id="data-sources" />} />
      <Route path="/website" component={() => <ModuleHost id="website" />} />
      <Route path="/integrations" component={() => <ModuleHost id="integrations" />} />
      <Route path="/admin" component={() => <ModuleHost id="admin" />} />
      <Route path="/settings" component={() => <ModuleHost id="settings" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      {/* Marketing landing page — bare, no shell */}
      <Route path="/" component={LandingPage} />

      {/* Marketing pages — bare, no shell */}
      <Route path="/pricing" component={PricingPage} />

      {/* Auth surfaces — bare, no shell */}
      <Route path="/auth/login" component={AuthLoginPage} />
      <Route path="/auth/sign-up" component={AuthSignUpPage} />
      <Route path="/auth/sign-up-success" component={AuthSignUpSuccessPage} />
      <Route path="/auth/error" component={AuthErrorPage} />

      {/* Workspace app lives under /app — shell stays mounted across navigation */}
      <Route path="/app">
        <WouterRouter base={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/app`}>
          <SpineProvider>
            <WorkspaceShell>
              <WorkspaceRoutes />
            </WorkspaceShell>
          </SpineProvider>
        </WouterRouter>
      </Route>
      <Route path="/app/:rest*">
        <WouterRouter base={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/app`}>
          <SpineProvider>
            <WorkspaceShell>
              <WorkspaceRoutes />
            </WorkspaceShell>
          </SpineProvider>
        </WouterRouter>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <PlatformProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </PlatformProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
