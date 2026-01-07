import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supplierSchema, formatZodErrors } from "@/lib/validations";

interface SupplierData {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  category: string;
  contact_name: string;
  notes: string;
  is_active: boolean;
}

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function SupplierForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { canEdit, user } = useAuth();

  const isViewing = location.pathname.includes("/fornecedores/") && !location.pathname.includes("/editar") && !location.pathname.includes("/novo");
  const isEditing = location.pathname.includes("/editar");
  const isNew = location.pathname.includes("/novo");

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SupplierData>({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    category: "",
    contact_name: "",
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchSupplier();
    }
  }, [id]);

  async function fetchSupplier() {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || "",
        cnpj: data.cnpj || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        category: data.category || "",
        contact_name: data.contact_name || "",
        notes: data.notes || "",
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      console.error("Error fetching supplier:", error);
      toast.error("Erro ao carregar fornecedor");
      navigate("/fornecedores");
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
    const validationResult = supplierSchema.safeParse(formData);
    if (!validationResult.success) {
      toast.error("Dados inválidos", {
        description: formatZodErrors(validationResult.error),
      });
      return;
    }

    setSaving(true);

    try {
      const validData = validationResult.data;
      const supplierData = {
        name: validData.name,
        cnpj: validData.cnpj || null,
        email: validData.email || null,
        phone: validData.phone || null,
        address: validData.address || null,
        city: validData.city || null,
        state: validData.state || null,
        category: validData.category || null,
        contact_name: validData.contact_name || null,
        notes: validData.notes || null,
        is_active: validData.is_active,
        ...(isNew && { created_by: user?.id }),
      };

      if (isNew) {
        const { error } = await supabase.from("suppliers").insert(supplierData);
        if (error) throw error;
        toast.success("Fornecedor criado com sucesso!");
      } else {
        const { error } = await supabase
          .from("suppliers")
          .update(supplierData)
          .eq("id", id);
        if (error) throw error;
        toast.success("Fornecedor atualizado com sucesso!");
      }

      navigate("/fornecedores");
    } catch (error: any) {
      console.error("Error saving supplier:", error);
      toast.error("Erro ao salvar fornecedor. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (field: keyof SupplierData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px]" />
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
            {isNew ? "Novo Fornecedor" : isEditing ? "Editar Fornecedor" : formData.name}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? "Preencha os dados do novo fornecedor"
              : isEditing
              ? "Atualize os dados do fornecedor"
              : formData.cnpj || "Fornecedor"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais do fornecedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome / Razão Social *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Nome do fornecedor"
                  required
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleChange("cnpj", formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  placeholder="Ex: Tecnologia, Serviços, Material"
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Fornecedor ativo no sistema
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => handleChange("is_active", v)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contato</CardTitle>
            <CardDescription>Informações de contato do fornecedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nome do Contato</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleChange("contact_name", e.target.value)}
                  placeholder="Nome da pessoa de contato"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@empresa.com"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(00) 00000-0000"
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>Localização do fornecedor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Rua, número, complemento"
                disabled={readOnly}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Cidade"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="UF"
                  maxLength={2}
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
              placeholder="Observações adicionais sobre o fornecedor"
              rows={4}
              disabled={readOnly}
            />
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/fornecedores")}
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
                  {isNew ? "Criar Fornecedor" : "Salvar Alterações"}
                </>
              )}
            </Button>
          </div>
        )}

        {readOnly && canEdit && (
          <div className="flex justify-end mt-6">
            <Button onClick={() => navigate(`/fornecedores/${id}/editar`)}>
              Editar Fornecedor
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
