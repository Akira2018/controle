import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import { contractSchema, formatZodErrors } from "@/lib/validations";

interface Supplier {
  id: string;
  name: string;
}

interface ContractData {
  contract_number: string;
  title: string;
  description: string;
  contract_type: string;
  status: "ativo" | "suspenso" | "encerrado" | "em_renovacao" | "rascunho";
  supplier_id: string;
  total_value: string;
  start_date: string;
  end_date: string;
  signature_date: string;
  renewal_date: string;
  payment_terms: string;
  notes: string;
}

const contractTypes = [
  "Serviços",
  "Fornecimento",
  "Locação",
  "Licenciamento",
  "Manutenção",
  "Consultoria",
  "Obra",
  "Publicidade",
  "Outros",
];

export default function ContractForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { canEdit, user } = useAuth();

  const isViewing = location.pathname.includes("/contratos/") && !location.pathname.includes("/editar") && !location.pathname.includes("/novo");
  const isEditing = location.pathname.includes("/editar");
  const isNew = location.pathname.includes("/novo");

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<ContractData>({
    contract_number: "",
    title: "",
    description: "",
    contract_type: "",
    status: "rascunho",
    supplier_id: "",
    total_value: "",
    start_date: "",
    end_date: "",
    signature_date: "",
    renewal_date: "",
    payment_terms: "",
    notes: "",
  });

  useEffect(() => {
    fetchSuppliers();
    if (id) {
      fetchContract();
    }
  }, [id]);

  async function fetchSuppliers() {
    const { data } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setSuppliers(data || []);
  }

  async function fetchContract() {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        contract_number: data.contract_number || "",
        title: data.title || "",
        description: data.description || "",
        contract_type: data.contract_type || "",
        status: data.status || "rascunho",
        supplier_id: data.supplier_id || "",
        total_value: data.total_value?.toString() || "",
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        signature_date: data.signature_date || "",
        renewal_date: data.renewal_date || "",
        payment_terms: data.payment_terms || "",
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Error fetching contract:", error);
      toast.error("Erro ao carregar contrato");
      navigate("/contratos");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canEdit) {
      toast.error("Você não tem permissão para esta ação");
      return;
    }

    // Validate form data with Zod
    const validationResult = contractSchema.safeParse(formData);
    if (!validationResult.success) {
      toast.error("Dados inválidos", {
        description: formatZodErrors(validationResult.error),
      });
      return;
    }

    setSaving(true);

    try {
      const validData = validationResult.data;
      const contractData = {
        contract_number: validData.contract_number,
        title: validData.title,
        description: validData.description || null,
        contract_type: validData.contract_type,
        status: validData.status,
        supplier_id: validData.supplier_id || null,
        total_value: validData.total_value ? parseFloat(validData.total_value) : null,
        start_date: validData.start_date,
        end_date: validData.end_date,
        signature_date: validData.signature_date || null,
        renewal_date: validData.renewal_date || null,
        payment_terms: validData.payment_terms || null,
        notes: validData.notes || null,
        ...(isNew && { created_by: user?.id }),
      };

      if (isNew) {
        const { error } = await supabase.from("contracts").insert(contractData);
        if (error) throw error;
        toast.success("Contrato criado com sucesso!");
      } else {
        const { error } = await supabase
          .from("contracts")
          .update(contractData)
          .eq("id", id);
        if (error) throw error;
        toast.success("Contrato atualizado com sucesso!");
      }

      navigate("/contratos");
    } catch (error: any) {
      console.error("Error saving contract:", error);
      toast.error("Erro ao salvar contrato. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (field: keyof ContractData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  const readOnly = isViewing && !isEditing;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "Novo Contrato" : isEditing ? "Editar Contrato" : formData.title}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? "Preencha os dados do novo contrato"
              : isEditing
              ? "Atualize os dados do contrato"
              : `Contrato ${formData.contract_number}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais do contrato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contract_number">Número do Contrato *</Label>
                <Input
                  id="contract_number"
                  value={formData.contract_number}
                  onChange={(e) => handleChange("contract_number", e.target.value)}
                  placeholder="Ex: CONT-2024-001"
                  required
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Título do contrato"
                  required
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Descrição detalhada do contrato"
                rows={3}
                disabled={readOnly}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contract_type">Tipo *</Label>
                <Select
                  value={formData.contract_type}
                  onValueChange={(v) => handleChange("contract_type", v)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleChange("status", v as ContractData["status"])}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="em_renovacao">Em Renovação</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Fornecedor</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(v) => handleChange("supplier_id", v)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="total_value">Valor Total (R$)</Label>
                <Input
                  id="total_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_value}
                  onChange={(e) => handleChange("total_value", e.target.value)}
                  placeholder="0,00"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => handleChange("payment_terms", e.target.value)}
                  placeholder="Ex: 30 dias após emissão da NF"
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Datas</CardTitle>
            <CardDescription>Vigência e datas importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  required
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Término *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange("end_date", e.target.value)}
                  required
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature_date">Data de Assinatura</Label>
                <Input
                  id="signature_date"
                  type="date"
                  value={formData.signature_date}
                  onChange={(e) => handleChange("signature_date", e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewal_date">Data de Renovação</Label>
                <Input
                  id="renewal_date"
                  type="date"
                  value={formData.renewal_date}
                  onChange={(e) => handleChange("renewal_date", e.target.value)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Observações adicionais sobre o contrato"
              rows={4}
              disabled={readOnly}
            />
          </CardContent>
        </Card>

        {id && !isNew && (
          <DocumentUpload contractId={id} readOnly={readOnly} />
        )}

        {!readOnly && (
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/contratos")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isNew ? "Criar Contrato" : "Salvar Alterações"}
                </>
              )}
            </Button>
          </div>
        )}

        {readOnly && canEdit && (
          <div className="flex justify-end mt-6">
            <Button onClick={() => navigate(`/contratos/${id}/editar`)}>
              Editar Contrato
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
