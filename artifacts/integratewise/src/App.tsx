import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

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
import AuthLoginPage from "@/pages/auth/login/index";
import AuthSignUpPage from "@/pages/auth/sign-up/index";
import AuthSignUpSuccessPage from "@/pages/auth/sign-up-success/index";
import AuthErrorPage from "@/pages/auth/error/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/architecture" component={ArchitecturePage} />
      <Route path="/brainstorming" component={BrainstormingPage} />
      <Route path="/campaigns" component={CampaignsPage} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/clients/:id" component={ClientDetailPage} />
      <Route path="/content" component={ContentPage} />
      <Route path="/data-flow" component={DataFlowPage} />
      <Route path="/data-sources" component={DataSourcesPage} />
      <Route path="/deals" component={DealsPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/knowledge" component={KnowledgePage} />
      <Route path="/knowledge/:category" component={KnowledgeCategoryPage} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/metrics" component={MetricsPage} />
      <Route path="/pipeline" component={PipelinePage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/sales" component={SalesPage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/sessions" component={SessionsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/strategy" component={StrategyPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/website" component={WebsitePage} />
      <Route path="/auth/login" component={AuthLoginPage} />
      <Route path="/auth/sign-up" component={AuthSignUpPage} />
      <Route path="/auth/sign-up-success" component={AuthSignUpSuccessPage} />
      <Route path="/auth/error" component={AuthErrorPage} />
      <Route component={NotFound} />
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
