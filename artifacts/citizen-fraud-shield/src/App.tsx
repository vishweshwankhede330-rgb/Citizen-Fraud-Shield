import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout/layout";
import Home from "@/pages/home";
import Check from "@/pages/check";
import Result from "@/pages/result";
import History from "@/pages/history";
import MyComplaints from "@/pages/my-complaints";
import PoliceDashboard from "@/pages/police-dashboard";
import { StoreProvider } from "@/lib/store";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Police Dashboard renders completely outside the citizen Layout */}
      <Route path="/police-dashboard" component={PoliceDashboard} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/check" component={Check} />
            <Route path="/result/:id" component={Result} />
            <Route path="/history" component={History} />
            <Route path="/my-complaints" component={MyComplaints} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
