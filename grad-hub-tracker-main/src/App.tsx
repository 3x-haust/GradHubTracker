import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import GraduateSearch from "./pages/GraduateSearch";
import GraduateRegister from "./pages/GraduateRegister";
import GraduateProfile from "./pages/GraduateProfile";
import GraduateEdit from "./pages/GraduateEdit";
import JobMatching from "./pages/JobMatching";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <DashboardLayout>
                <ProtectedRoute>{<Dashboard />}</ProtectedRoute>
              </DashboardLayout>
            }
          />
          <Route
            path="/search"
            element={
              <DashboardLayout>
                <ProtectedRoute>{<GraduateSearch />}</ProtectedRoute>
              </DashboardLayout>
            }
          />
          <Route
            path="/register"
            element={
              <DashboardLayout>
                <ProtectedRoute>{<GraduateRegister />}</ProtectedRoute>
              </DashboardLayout>
            }
          />
          <Route
            path="/graduates/:id"
            element={
              <DashboardLayout>
                <ProtectedRoute>{<GraduateProfile />}</ProtectedRoute>
              </DashboardLayout>
            }
          />
          <Route
            path="/graduates/:id/edit"
            element={
              <DashboardLayout>
                <ProtectedRoute>{<GraduateEdit />}</ProtectedRoute>
              </DashboardLayout>
            }
          />
          <Route
            path="/jobs"
            element={
              <DashboardLayout>
                <ProtectedRoute>{<JobMatching />}</ProtectedRoute>
              </DashboardLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <ProtectedRoute role="admin">{<Settings />}</ProtectedRoute>
              </DashboardLayout>
            }
          />
          <Route
            path="*"
            element={
              <DashboardLayout>
                <NotFound />
              </DashboardLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
