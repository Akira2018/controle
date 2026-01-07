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
import { Search, CreditCard, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Payment {
  id: string;
  description: string | null;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  invoice_number: string | null;
  contract_title: string;
  contract_id: string;
}

interface Contract {
  id: string;
  title: string;
}

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

const statusStyles: Record<string, string> = {
  pendente: "status-pending",
  pago: "status-active",
  atrasado: "status-expired",
  cancelado: "status-draft",
};

export default function Payments() {
  const { canEdit, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    contract_id: "",
    description: "",
    amount: "",
    due_date: "",
    invoice_number: "",
    notes: "",
  });

  useEffect(() => {
    fetchPayments();
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

  async function fetchPayments() {
    try {
      let query = supabase
        .from("payments")
        .select(`
          id,
          description,
          amount,
          due_date,
          payment_date,
          status,
          invoice_number,
          contracts(id, title)
        `)
        .order("due_date", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPayments(
        data?.map((p: any) => ({
          ...p,
          contract_title: p.contracts?.title || "Sem contrato",
          contract_id: p.contracts?.id || "",
        })) || []
      );
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!formData.contract_id || !formData.amount || !formData.due_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const amount = parseFloat(formData.amount.replace(/\D/g, "")) / 100;
    if (isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("payments").insert({
        contract_id: formData.contract_id,
        description: formData.description || null,
        amount: amount,
        due_date: formData.due_date,
        invoice_number: formData.invoice_number || null,
        notes: formData.notes || null,
        status: "pendente",
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Pagamento cadastrado com sucesso");
      setIsDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Erro ao cadastrar pagamento");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setFormData({
      contract_id: "",
      description: "",
      amount: "",
      due_date: "",
      invoice_number: "",
      notes: "",
    });
  }

  function handleAmountChange(value: string) {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    // Format as currency
    const number = parseInt(digits || "0", 10);
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(number / 100);
    setFormData({ ...formData, amount: formatted });
  }

  async function markAsPaid(id: string) {
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "pago",
          payment_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Pagamento marcado como pago");
      fetchPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Erro ao atualizar pagamento");
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const searchLower = search.toLowerCase();
    return (
      payment.contract_title.toLowerCase().includes(searchLower) ||
      (payment.description?.toLowerCase().includes(searchLower) ?? false) ||
      (payment.invoice_number?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const formatCurrency = (value: number) => {
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
          <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">
            Acompanhe os pagamentos dos contratos
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pagamento
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
                placeholder="Buscar pagamentos..."
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
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhum pagamento encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Tente ajustar a busca" : "Cadastre seu primeiro pagamento"}
              </p>
              {canEdit && !search && (
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Pagamento
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Nota Fiscal</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        to={`/contratos/${payment.contract_id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {payment.contract_title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {payment.description || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.invoice_number || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.due_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {payment.payment_date
                        ? format(new Date(payment.payment_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusStyles[payment.status]}
                      >
                        {statusLabels[payment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit && payment.status === "pendente" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsPaid(payment.id)}
                          title="Marcar como pago"
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

      {/* Create Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Pagamento</DialogTitle>
            <DialogDescription>
              Cadastre um novo pagamento vinculado a um contrato
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_number">Número da Nota Fiscal</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="Ex: NF-001234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do pagamento..."
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
