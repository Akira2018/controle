import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, Eye, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  contract_type: string;
  status: string;
  total_value: number | null;
  start_date: string;
  end_date: string;
  supplier_name: string | null;
}

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
  em_renovacao: "Em Renovação",
  rascunho: "Rascunho",
};

const statusStyles: Record<string, string> = {
  ativo: "status-active",
  suspenso: "status-pending",
  encerrado: "status-expired",
  em_renovacao: "status-pending",
  rascunho: "status-draft",
};

export default function Contracts() {
  const { canEdit } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchContracts();
  }, [statusFilter]);

  async function fetchContracts() {
    try {
      const baseQuery = supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          title,
          contract_type,
          status,
          total_value,
          start_date,
          end_date,
          suppliers(name)
        `)
        .order("created_at", { ascending: false });

      const query = statusFilter !== "all"
        ? baseQuery.eq("status", statusFilter as "ativo" | "suspenso" | "encerrado" | "em_renovacao" | "rascunho")
        : baseQuery;

      const { data, error } = await query;

      if (error) throw error;

      setContracts(
        data?.map((c: any) => ({
          ...c,
          supplier_name: c.suppliers?.name || null,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredContracts = contracts.filter((contract) => {
    const searchLower = search.toLowerCase();
    return (
      contract.title.toLowerCase().includes(searchLower) ||
      contract.contract_number.toLowerCase().includes(searchLower) ||
      (contract.supplier_name?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus contratos
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link to="/contratos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, número ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
                <SelectItem value="em_renovacao">Em Renovação</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhum contrato encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando seu primeiro contrato"}
              </p>
              {canEdit && !search && statusFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link to="/contratos/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Contrato
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {contract.contract_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contract.supplier_name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{contract.contract_type}</TableCell>
                    <TableCell>{formatCurrency(contract.total_value)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>
                          {format(new Date(contract.start_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          até{" "}
                          {format(new Date(contract.end_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusStyles[contract.status]}
                      >
                        {statusLabels[contract.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/contratos/${contract.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/contratos/${contract.id}/editar`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
