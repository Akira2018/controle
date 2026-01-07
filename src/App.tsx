import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Contracts from "@/pages/Contracts";
import ContractForm from "@/pages/ContractForm";
import Suppliers from "@/pages/Suppliers";
import SupplierForm from "@/pages/SupplierForm";
import Obligations from "@/pages/Obligations";
import Payments from "@/pages/Payments";
import Users from "@/pages/Users";
import AuditLogs from "@/pages/AuditLogs";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster position="top-right" />
      <BrowserRouter basename="/controle">  {/* 👈 ADICIONE O BASENAME AQUI */}
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contratos" element={<Contracts />} />
              <Route path="/contratos/novo" element={<ContractForm />} />
              <Route path="/contratos/:id" element={<ContractForm />} />
              <Route path="/contratos/:id/editar" element={<ContractForm />} />
              <Route path="/fornecedores" element={<Suppliers />} />
              <Route path="/fornecedores/novo" element={<SupplierForm />} />
              <Route path="/fornecedores/:id" element={<SupplierForm />} />
              <Route path="/fornecedores/:id/editar" element={<SupplierForm />} />
              <Route path="/obrigacoes" element={<Obligations />} />
              <Route path="/pagamentos" element={<Payments />} />
              <Route path="/usuarios" element={<Users />} />
              <Route path="/auditoria" element={<AuditLogs />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
