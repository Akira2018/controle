import { z } from "zod";

// Contract validation schema
export const contractSchema = z.object({
  contract_number: z
    .string()
    .trim()
    .min(1, "Número do contrato é obrigatório")
    .max(50, "Número do contrato deve ter no máximo 50 caracteres"),
  title: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  description: z
    .string()
    .max(2000, "Descrição deve ter no máximo 2000 caracteres")
    .optional()
    .nullable(),
  contract_type: z
    .string()
    .min(1, "Tipo de contrato é obrigatório"),
  status: z.enum(["ativo", "suspenso", "encerrado", "em_renovacao", "rascunho"]),
  supplier_id: z.string().uuid().optional().nullable().or(z.literal("")),
  total_value: z
    .string()
    .refine(
      (val) => val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      "Valor deve ser um número positivo"
    )
    .optional(),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().min(1, "Data de término é obrigatória"),
  signature_date: z.string().optional().nullable(),
  renewal_date: z.string().optional().nullable(),
  payment_terms: z
    .string()
    .max(500, "Condições de pagamento devem ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, "Observações devem ter no máximo 2000 caracteres")
    .optional()
    .nullable(),
});

export type ContractFormData = z.infer<typeof contractSchema>;

// Supplier validation schema
export const supplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  cnpj: z
    .string()
    .max(18, "CNPJ inválido")
    .refine(
      (val) => val === "" || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(val),
      "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX"
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres")
    .optional()
    .nullable()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .optional()
    .nullable(),
  address: z
    .string()
    .max(500, "Endereço deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  state: z
    .string()
    .max(2, "Estado deve ter 2 caracteres")
    .optional()
    .nullable(),
  category: z
    .string()
    .max(100, "Categoria deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  contact_name: z
    .string()
    .max(200, "Nome do contato deve ter no máximo 200 caracteres")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, "Observações devem ter no máximo 2000 caracteres")
    .optional()
    .nullable(),
  is_active: z.boolean(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  password: z
    .string()
    .min(1, "Senha é obrigatória"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(72, "Senha deve ter no máximo 72 caracteres"),
  confirmPassword: z
    .string()
    .min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Payment validation schema
export const paymentSchema = z.object({
  contract_id: z.string().uuid("Contrato é obrigatório"),
  amount: z
    .number()
    .positive("Valor deve ser positivo")
    .max(999999999.99, "Valor muito alto"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  invoice_number: z
    .string()
    .max(100, "Número da nota deve ter no máximo 100 caracteres")
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// Obligation validation schema
export const obligationSchema = z.object({
  contract_id: z.string().uuid("Contrato é obrigatório"),
  title: z
    .string()
    .trim()
    .min(1, "Título é obrigatório")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  obligation_type: z.string().min(1, "Tipo é obrigatório"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  description: z
    .string()
    .max(2000, "Descrição deve ter no máximo 2000 caracteres")
    .optional()
    .nullable(),
});

export type ObligationFormData = z.infer<typeof obligationSchema>;

// Helper to format Zod errors for display
export function formatZodErrors(error: z.ZodError): string {
  return error.errors.map((e) => e.message).join(". ");
}
