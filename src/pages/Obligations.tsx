import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ClipboardList, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Obligation {
  id: string;
  title: string;
  description: string | null;
  obligation_type: string;
  due_date: string;
  status: string;
  contract_title: string;
  contract_id: string;
}

interface Contract {
  id: string;
  title: string;
}

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
};

const statusStyles: Record<string, string> = {
  pendente: "status-pending",
  em_andamento: "status-pending",
  concluido: "status-active",
  atrasado: "status-expired",
};

const obligationTypes = [
  "Entrega de Relatório",
  "Pagamento",
  "Renovação",
  "Notificação",
  "Auditoria",
  "Prestação de Contas",
  "Outro",
];

export default function Obligations() {
  const { canEdit, user } = useAuth();
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    contract_id: "",
    title: "",
    description: "",
    obligation_type: "",
    due_date: "",
    status: "pendente" as const,
  });

  useEffect(() => {
    fetchObligations();
    fetchContracts();
  }, [statusFilter]);

  async function fetchContracts() {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, title")
        .eq("status", "ativo")
        .order("title");

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  }

  async function fetchObligations() {
    try {
      const baseQuery = supabase
        .from("obligations")
        .select(`
          id,
          title,
          description,
          obligation_type,
          due_date,
          status,
          contracts(id, title)
        `)
        .order("due_date", { ascending: true });

      const query = statusFilter !== "all"
        ? baseQuery.eq("status", statusFilter as "pendente" | "em_andamento" | "concluido" | "atrasado")
        : baseQuery;

      const { data, error } = await query;

      if (error) throw error;

      setObligations(
        data?.map((o: any) => ({
          ...o,
          contract_title: o.contracts?.title || "Sem contrato",
          contract_id: o.contracts?.id || "",
        })) || []
      );
    } catch (error) {
      console.error("Error fetching obligations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.contract_id || !formData.title || !formData.obligation_type || !formData.due_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("obligations").insert({
        contract_id: formData.contract_id,
        title: formData.title,
        description: formData.description || null,
        obligation_type: formData.obligation_type,
        due_date: formData.due_date,
        status: formData.status,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Obrigação cadastrada com sucesso");
      setIsDialogOpen(false);
      resetForm();
      fetchObligations();
    } catch (error) {
      console.error("Error creating obligation:", error);
      toast.error("Erro ao cadastrar obrigação");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setFormData({
      contract_id: "",
      title: "",
      description: "",
      obligation_type: "",
      due_date: "",
      status: "pendente",
    });
  }

  async function markAsCompleted(id: string) {
    try {
      const { error } = await supabase
        .from("obligations")
        .update({
          status: "concluido",
          completed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Obrigação marcada como concluída");
      fetchObligations();
    } catch (error) {
      console.error("Error updating obligation:", error);
      toast.error("Erro ao atualizar obrigação");
    }
  }

  const filteredObligations = obligations.filter((obligation) => {
    const searchLower = search.toLowerCase();
    return (
      obligation.title.toLowerCase().includes(searchLower) ||
      obligation.contract_title.toLowerCase().includes(searchLower)
    );
  });

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const getDueBadge = (dueDate: string, status: string) => {
    if (status === "concluido") return null;

    const days = getDaysUntilDue(dueDate);
    if (days < 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          {Math.abs(days)} dias atrasado
        </Badge>
      );
    }
    if (days === 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          Vence hoje
        </Badge>
      );
    }
    if (days <= 7) {
      return (
        <Badge variant="default" className="ml-2">
          {days} dias
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
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
          <h1 className="text-2xl font-semibold tracking-tight">Obrigações</h1>
          <p className="text-muted-foreground">
            Acompanhe as obrigações e prazos dos contratos
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Obrigação
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
                placeholder="Buscar obrigações..."
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredObligations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhuma obrigação encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Tente ajustar a busca" : "Cadastre sua primeira obrigação"}
              </p>
              {canEdit && !search && (
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Obrigação
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obrigação</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredObligations.map((obligation) => (
                  <TableRow key={obligation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{obligation.title}</p>
                        {obligation.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {obligation.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/contratos/${obligation.contract_id}`}
                        className="text-primary hover:underline"
                      >
                        {obligation.contract_title}
                      </Link>
                    </TableCell>
                    <TableCell>{obligation.obligation_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span>
                          {format(new Date(obligation.due_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                        {getDueBadge(obligation.due_date, obligation.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusStyles[obligation.status]}
                      >
                        {statusLabels[obligation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit && obligation.status !== "concluido" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsCompleted(obligation.id)}
                          title="Marcar como concluído"
                        >
                          <CheckCircle2 className="h-4 w-4 text-status-active" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Obligation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Obrigação</DialogTitle>
            <DialogDescription>
              Cadastre uma nova obrigação contratual
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contract">Contrato *</Label>
              <Select
                value={formData.contract_id}
                onValueChange={(value) => setFormData({ ...formData, contract_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Entrega do relatório mensal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.obligation_type}
                onValueChange={(value) => setFormData({ ...formData, obligation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {obligationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais sobre a obrigação..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
