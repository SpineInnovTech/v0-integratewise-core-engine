import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Show } from "@clerk/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import {
  basePath,
  ClerkAppProvider,
  Landing,
  SignInPage,
  SignUpPage,
  withAuth,
} from "@/components/auth/clerk-config";

// Pages
import HomePage from "@/pages/home";
import AdminPage from "@/pages/admin/index";
import ArchitecturePage from "@/pages/architecture/index";
import BrainstormingPage from "@/pages/brainstorming/index";
import CampaignsPage from "@/pages/campaigns/index";
import ClientsPage from "@/pages/clients/index";
import ClientDetailPage from "@/pages/clients/detail/index";
import ContentPage from "@/pages/content/index";
import DataFlowPage from "@/pages/data-flow/index";
import DataSourcesPage from "@/pages/data-sources/index";
import DealsPage from "@/pages/deals/index";
import IntegrationsPage from "@/pages/integrations/index";
import KnowledgePage from "@/pages/knowledge/index";
import KnowledgeCategoryPage from "@/pages/knowledge/category/index";
import LeadsPage from "@/pages/leads/index";
import LeadDetailPage from "@/pages/leads/detail/index";
import MetricsPage from "@/pages/metrics/index";
import PipelinePage from "@/pages/pipeline/index";
import ProductsPage from "@/pages/products/index";
import ProjectsPage from "@/pages/projects/index";
import SalesPage from "@/pages/sales/index";
import ServicesPage from "@/pages/services/index";
import SessionsPage from "@/pages/sessions/index";
import SettingsPage from "@/pages/settings/index";
import StrategyPage from "@/pages/strategy/index";
import TasksPage from "@/pages/tasks/index";
import WebsitePage from "@/pages/website/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Base path "/": signed-in users get the dashboard, signed-out users get the
// public landing (never auto-redirected to sign-in).
function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <HomePage />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />

      {/* Clerk auth routes — the /*? optional wildcard matches both the bare URL
          and Clerk's OAuth sub-paths. Copy verbatim. */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      {/* Legacy mock-auth routes now redirect to the real Clerk flows. */}
      <Route path="/auth/login">
        <Redirect to="/sign-in" />
      </Route>
      <Route path="/auth/sign-up">
        <Redirect to="/sign-up" />
      </Route>
      <Route path="/auth/sign-up-success">
        <Redirect to="/sign-in" />
      </Route>
      <Route path="/auth/error">
        <Redirect to="/sign-in" />
      </Route>

      {/* Protected app routes — require a signed-in Clerk session. */}
      <Route path="/admin" component={withAuth(AdminPage)} />
      <Route path="/architecture" component={withAuth(ArchitecturePage)} />
      <Route path="/brainstorming" component={withAuth(BrainstormingPage)} />
      <Route path="/campaigns" component={withAuth(CampaignsPage)} />
      <Route path="/clients" component={withAuth(ClientsPage)} />
      <Route path="/clients/:id" component={withAuth(ClientDetailPage)} />
      <Route path="/content" component={withAuth(ContentPage)} />
      <Route path="/data-flow" component={withAuth(DataFlowPage)} />
      <Route path="/data-sources" component={withAuth(DataSourcesPage)} />
      <Route path="/deals" component={withAuth(DealsPage)} />
      <Route path="/integrations" component={withAuth(IntegrationsPage)} />
      <Route path="/knowledge" component={withAuth(KnowledgePage)} />
      <Route
        path="/knowledge/:category"
        component={withAuth(KnowledgeCategoryPage)}
      />
      <Route path="/leads" component={withAuth(LeadsPage)} />
      <Route path="/leads/:id" component={withAuth(LeadDetailPage)} />
      <Route path="/metrics" component={withAuth(MetricsPage)} />
      <Route path="/pipeline" component={withAuth(PipelinePage)} />
      <Route path="/products" component={withAuth(ProductsPage)} />
      <Route path="/projects" component={withAuth(ProjectsPage)} />
      <Route path="/sales" component={withAuth(SalesPage)} />
      <Route path="/services" component={withAuth(ServicesPage)} />
      <Route path="/sessions" component={withAuth(SessionsPage)} />
      <Route path="/settings" component={withAuth(SettingsPage)} />
      <Route path="/strategy" component={withAuth(StrategyPage)} />
      <Route path="/tasks" component={withAuth(TasksPage)} />
      <Route path="/website" component={withAuth(WebsitePage)} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <WouterRouter base={basePath}>
          <ClerkAppProvider>
            <Router />
          </ClerkAppProvider>
        </WouterRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
