import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import AuthGuard from "./components/AuthGuard";
import AdminRouteGuard from "./components/AdminRouteGuard";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import CurrencyTest from "./pages/CurrencyTest";
import AdminDashboard from "./pages/AdminDashboard";
import { PipelineProvider } from "./contexts/PipelineContext";
import { AuthProvider } from "./contexts/AuthContext";

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PipelineProvider>
          <div>
            <Switch>
            <Route path="/login" component={Login} />

            {/* Protected routes */}
            <Route path="/leaderboard">
              <AuthGuard allowedRoles={['admin', 'manager', 'sales', 'sales_rep']}>
                <Layout>
                  <Leaderboard />
                </Layout>
              </AuthGuard>
            </Route>

          <Route path="/pipeline">
            <AuthGuard allowedRoles={['admin', 'manager', 'sales', 'sales_rep']}>
              <Layout>
                <Pipeline />
              </Layout>
            </AuthGuard>
          </Route>

          <Route path="/team">
            <AuthGuard allowedRoles={['admin', 'manager', 'sales', 'sales_rep']}>
              <Layout>
                <Team />
              </Layout>
            </AuthGuard>
          </Route>

          <Route path="/settings">
            <AuthGuard allowedRoles={['admin', 'manager']}>
              <Layout>
                <Settings />
              </Layout>
            </AuthGuard>
          </Route>

          <Route path="/currency-test">
            <AuthGuard allowedRoles={['admin']}>
              <Layout>
                <CurrencyTest />
              </Layout>
            </AuthGuard>
          </Route>

          {/* Admin route - only accessible to admins */}
          <Route path="/admin">
            <AdminRouteGuard>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRouteGuard>
          </Route>

          <Route path="/">
            <AuthGuard allowedRoles={['admin', 'manager', 'sales_rep']}>
              <Layout>
                <Dashboard />
              </Layout>
            </AuthGuard>
          </Route>

          {/* Catch-all route - redirect to dashboard */}
          <Route>
            <AuthGuard allowedRoles={['admin', 'manager', 'sales_rep']}>
              <Layout>
                <Dashboard />
              </Layout>
            </AuthGuard>
          </Route>
          </Switch>
          </div>
          <Toaster />
        </PipelineProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
