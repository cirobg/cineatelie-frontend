/**
 * The single source of truth for the sidebar and the protected route table (frontend spec
 * §4). The sidebar renders this filtered by permission; the router generates one placeholder
 * route per entry until each feature module lands — deliberately one array, not two lists
 * that could drift.
 */
export interface NavItem {
  group: string;
  label: string;
  path: string;
  permission: string;
  primaryAction: string | null;
}

export const NAV_ITEMS: NavItem[] = [
  { group: "Painel", label: "Visão Geral", path: "/", permission: "dashboard:read", primaryAction: null },
  {
    group: "Comercial",
    label: "Orçamentos",
    path: "/orcamentos",
    permission: "quotes:read",
    primaryAction: "Novo orçamento",
  },
  { group: "Cadastros", label: "Clientes", path: "/clientes", permission: "clients:read", primaryAction: "Adicionar cliente" },
  { group: "Cadastros", label: "Serviços", path: "/servicos", permission: "services:read", primaryAction: "Novo tipo de serviço" },
  { group: "Cadastros", label: "Pronta Entrega", path: "/pronta-entrega", permission: "rtw:read", primaryAction: "Nova peça" },
  { group: "Cadastros", label: "Estoque e Insumos", path: "/estoque", permission: "stock:read", primaryAction: "Entrada de material" },
  { group: "Cadastros", label: "Fornecedores", path: "/fornecedores", permission: "suppliers:read", primaryAction: "Novo fornecedor" },
  { group: "Produção", label: "Ordens de Serviço", path: "/ordens", permission: "orders:read", primaryAction: "Nova ordem" },
  { group: "Produção", label: "Agenda", path: "/agenda", permission: "agenda:read", primaryAction: "Novo compromisso" },
  { group: "Financeiro", label: "Fluxo de Caixa", path: "/caixa", permission: "finance:read", primaryAction: "Novo lançamento" },
  { group: "Sistema", label: "Contratos", path: "/contratos", permission: "contracts:read", primaryAction: null },
  { group: "Sistema", label: "Meu plano", path: "/meu-plano", permission: "authenticated", primaryAction: null },
  {
    group: "Sistema",
    label: "Configurações",
    path: "/configuracoes",
    permission: "settings:read",
    primaryAction: "Salvar configurações",
  },
];
