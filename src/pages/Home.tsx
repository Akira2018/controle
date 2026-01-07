import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Building2,
  ClipboardList,
  CreditCard,
  BarChart3,
  Plus,
  ArrowRight,
} from "lucide-react";

const quickActions = [
  {
    title: "Novo Contrato",
    description: "Cadastre um novo contrato no sistema",
    icon: FileText,
    href: "/contratos/novo",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Novo Fornecedor",
    description: "Adicione um novo fornecedor ao cadastro",
    icon: Building2,
    href: "/fornecedores/novo",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    title: "Nova Obrigação",
    description: "Registre uma nova obrigação contratual",
    icon: ClipboardList,
    href: "/obrigacoes",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    title: "Novo Pagamento",
    description: "Lance um pagamento previsto",
    icon: CreditCard,
    href: "/pagamentos",
    color: "bg-violet-500/10 text-violet-600",
  },
];

const navigationCards = [
  {
    title: "Dashboard",
    description: "Visualize indicadores, alertas e contratos próximos do vencimento",
    icon: BarChart3,
    href: "/dashboard",
  },
  {
    title: "Contratos",
    description: "Gerencie todos os contratos cadastrados no sistema",
    icon: FileText,
    href: "/contratos",
  },
  {
    title: "Fornecedores",
    description: "Consulte e gerencie o cadastro de fornecedores",
    icon: Building2,
    href: "/fornecedores",
  },
  {
    title: "Obrigações",
    description: "Acompanhe as obrigações contratuais pendentes",
    icon: ClipboardList,
    href: "/obrigacoes",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { profile, canEdit } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Bem-vindo ao sistema de gestão de contratos. O que você gostaria de fazer hoje?
        </p>
      </div>

      {/* Quick Actions */}
      {canEdit && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Ações Rápidas</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card
                key={action.title}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                onClick={() => navigate(action.href)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <CardTitle className="text-base">{action.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Navegar para</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {navigationCards.map((card) => (
            <Card
              key={card.title}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
              onClick={() => navigate(card.href)}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <card.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div className="text-center sm:text-left">
            <h3 className="font-semibold">Precisa de ajuda?</h3>
            <p className="text-sm text-muted-foreground">
              Acesse o dashboard para ver indicadores e alertas importantes
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")}>
            Ir para o Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
