import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Building2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInDays, addDays } from "date-fns";

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalValue: number;
  totalSuppliers: number;
  pendingObligations: number;
}

interface ExpiringContract {
  id: string;
  title: string;
  contract_number: string;
  end_date: string;
  supplier_name: string | null;
}

const EXPIRY_PERIOD_OPTIONS = [
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
  { value: "180", label: "180 dias" },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringContracts, setExpiringContracts] = useState<ExpiringContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiryPeriod, setExpiryPeriod] = useState("30");

  useEffect(() => {
    fetchDashboardData();
  }, [expiryPeriod]);

  async function fetchDashboardData() {
    try {
      const today = new Date();
      const periodDays = parseInt(expiryPeriod);
      const periodEndDate = addDays(today, periodDays);

      // Fetch contracts count
      const { count: totalContracts } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true });

      // Fetch active contracts
      const { count: activeContracts } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");

      // Fetch expiring contracts (next 30 days)
      const { data: expiringData, count: expiringCount } = await supabase
        .from("contracts")
        .select(`
          id,
          title,
          contract_number,
          end_date,
          suppliers(name)
        `, { count: "exact" })
        .eq("status", "ativo")
        .gte("end_date", today.toISOString().split("T")[0])
        .lte("end_date", periodEndDate.toISOString().split("T")[0])
        .order("end_date", { ascending: true })
        .limit(5);

      // Fetch total value
      const { data: valueData } = await supabase
        .from("contracts")
        .select("total_value")
        .eq("status", "ativo");

      const totalValue = valueData?.reduce((sum, c) => sum + (Number(c.total_value) || 0), 0) || 0;

      // Fetch suppliers count
      const { count: totalSuppliers } = await supabase
        .from("suppliers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch pending obligations
      const { count: pendingObligations } = await supabase
        .from("obligations")
        .select("*", { count: "exact", head: true })
        .in("status", ["pendente", "em_andamento"]);

      setStats({
        totalContracts: totalContracts || 0,
        activeContracts: activeContracts || 0,
        expiringContracts: expiringCount || 0,
        totalValue,
        totalSuppliers: totalSuppliers || 0,
        pendingObligations: pendingObligations || 0,
      });

      setExpiringContracts(
        expiringData?.map((c: any) => ({
          id: c.id,
          title: c.title,
          contract_number: c.contract_number,
          end_date: c.end_date,
          supplier_name: c.suppliers?.name || null,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  const getExpiryBadgeVariant = (days: number) => {
    if (days <= 7) return "destructive";
    if (days <= 15) return "default";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos seus contratos e obrigações
          </p>
        </div>
        <Button asChild>
          <Link to="/contratos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Contrato
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Ativos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeContracts}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.totalContracts} total
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              em contratos ativos
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fornecedores
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-status-pending/20 bg-status-pending-bg/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vencendo em
            </CardTitle>
            <Select value={expiryPeriod} onValueChange={setExpiryPeriod}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-pending">
              {stats?.expiringContracts}
            </div>
            <p className="text-xs text-muted-foreground">
              contratos precisam de atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expiring Contracts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Contratos Vencendo</CardTitle>
              <CardDescription>Próximos {expiryPeriod} dias</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/contratos?filter=expiring">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {expiringContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhum contrato vencendo nos próximos {expiryPeriod} dias
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiringContracts.map((contract) => {
                  const daysUntil = getDaysUntilExpiry(contract.end_date);
                  return (
                    <Link
                      key={contract.id}
                      to={`/contratos/${contract.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{contract.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {contract.contract_number}
                          {contract.supplier_name && ` • ${contract.supplier_name}`}
                        </p>
                      </div>
                      <Badge variant={getExpiryBadgeVariant(daysUntil)}>
                        {daysUntil === 0
                          ? "Vence hoje"
                          : daysUntil === 1
                          ? "Vence amanhã"
                          : `${daysUntil} dias`}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Obligations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Obrigações Pendentes</CardTitle>
              <CardDescription>Próximas tarefas a cumprir</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/obrigacoes">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <span className="text-2xl font-bold text-primary">
                  {stats?.pendingObligations}
                </span>
              </div>
              <p className="text-sm font-medium">Obrigações pendentes</p>
              <p className="text-xs text-muted-foreground mt-1">
                Acesse a lista de obrigações para mais detalhes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
