import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import PopsList from "./pages/PopsList.tsx";
import PopCreateEdit from "./pages/PopCreateEdit.tsx";
import PopDetail from "./pages/PopDetail.tsx";
import PopExecution from "./pages/PopExecution.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/pops" element={<RequireAuth><PopsList /></RequireAuth>} />
            <Route path="/pops/novo" element={<RequireAuth><PopCreateEdit /></RequireAuth>} />
            <Route path="/pops/:id" element={<RequireAuth><PopDetail /></RequireAuth>} />
            <Route path="/pops/:id/editar" element={<RequireAuth><PopCreateEdit /></RequireAuth>} />
            <Route path="/execucao/:id" element={<RequireAuth><PopExecution /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
