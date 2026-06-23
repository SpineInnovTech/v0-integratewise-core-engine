import { Switch, Route, Router as WouterRouter, useParams } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import { SpineProvider } from "@/spine/spine-context";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { ModuleHost } from "@/components/workspace/module-host";
import { RoleDashboard } from "@/components/workspace/role-dashboard";

import { LeadDetailView } from "@/components/views/lead-detail-view";
import { ClientDetailView } from "@/components/views/client-detail-view";

// Auth pages render bare (outside the persistent shell)
import AuthLoginPage from "@/pages/auth/login/index";
import AuthSignUpPage from "@/pages/auth/sign-up/index";
import AuthSignUpSuccessPage from "@/pages/auth/sign-up-success/index";
import AuthErrorPage from "@/pages/auth/error/index";
import NotFound from "@/pages/not-found";

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
      <Route path="/" component={RoleDashboard} />
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
      {/* Auth surfaces — bare, no shell */}
      <Route path="/auth/login" component={AuthLoginPage} />
      <Route path="/auth/sign-up" component={AuthSignUpPage} />
      <Route path="/auth/sign-up-success" component={AuthSignUpSuccessPage} />
      <Route path="/auth/error" component={AuthErrorPage} />

      {/* Everything else lives inside the persistent shell. This catch-all
          Route stays mounted across module navigation, so the shell (sidebar
          + topbar) never unmounts — only the inner content swaps. */}
      <Route>
        <SpineProvider>
          <WorkspaceShell>
            <WorkspaceRoutes />
          </WorkspaceShell>
        </SpineProvider>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
