import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, Eye, Edit } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  contracts_count: number;
}

export default function Suppliers() {
  const { canEdit } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select(`
          id,
          name,
          cnpj,
          email,
          phone,
          category,
          city,
          state,
          is_active,
          contracts(id)
        `)
        .order("name", { ascending: true });

      if (error) throw error;

      setSuppliers(
        data?.map((s: any) => ({
          ...s,
          contracts_count: s.contracts?.length || 0,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchLower = search.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      (supplier.cnpj?.includes(search) ?? false) ||
      (supplier.email?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const formatCNPJ = (cnpj: string | null) => {
    if (!cnpj) return "-";
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
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
          <h1 className="text-2xl font-semibold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores e parceiros
          </p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link to="/fornecedores/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Link>
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? "Tente ajustar a busca"
                  : "Comece cadastrando seu primeiro fornecedor"}
              </p>
              {canEdit && !search && (
                <Button asChild className="mt-4">
                  <Link to="/fornecedores/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Fornecedor
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Contratos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCNPJ(supplier.cnpj)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {supplier.email && <p>{supplier.email}</p>}
                        {supplier.phone && (
                          <p className="text-muted-foreground">{supplier.phone}</p>
                        )}
                        {!supplier.email && !supplier.phone && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.category || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.city && supplier.state
                        ? `${supplier.city}, ${supplier.state}`
                        : supplier.city || supplier.state || (
                            <span className="text-muted-foreground">-</span>
                          )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{supplier.contracts_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={supplier.is_active ? "status-active" : "status-draft"}
                      >
                        {supplier.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/fornecedores/${supplier.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/fornecedores/${supplier.id}/editar`}>
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
