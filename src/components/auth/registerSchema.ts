import { z } from 'zod';
import { isAfter, startOfDay } from 'date-fns';
import { validateDocument, validateCNHDocument } from '@/lib/documentValidation';

export const registerSchema = z
  .object({
    role: z.enum(['locador', 'motorista']),
    email: z
      .string()
      .trim()
      .min(1, { message: 'E-mail é obrigatório' })
      .email({ message: 'Digite um e-mail válido' })
      .max(255, { message: 'E-mail deve ter no máximo 255 caracteres' }),
    password: z
      .string()
      .min(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
      .max(72, { message: 'A senha deve ter no máximo 72 caracteres' })
      .regex(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula' })
      .regex(/[a-z]/, { message: 'A senha deve conter pelo menos uma letra minúscula' })
      .regex(/[0-9]/, { message: 'A senha deve conter pelo menos um número' })
      .regex(/[^A-Za-z0-9]/, { message: 'A senha deve conter pelo menos um caractere especial' }),
    confirmPassword: z.string().min(1, { message: 'Confirme sua senha' }),
    document: z.string().min(1, { message: 'Documento é obrigatório' }),
    cnh: z.string().optional().default(''),
    cnhExpiry: z.string().optional().default(''),
    acceptedTerms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'As senhas não coincidem',
      });
    }

    const docValidation = validateDocument(data.document);
    if (!docValidation.isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['document'], message: docValidation.message });
    } else if (data.role === 'motorista' && docValidation.type !== 'cpf') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['document'],
        message: 'Motorista deve informar um CPF válido (11 dígitos)',
      });
    }

    if (data.role === 'motorista') {
      const cnhValidation = validateCNHDocument(data.cnh ?? '');
      if (!cnhValidation.isValid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cnh'], message: cnhValidation.message });
      }

      if (!data.cnhExpiry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cnhExpiry'],
          message: 'Data de validade da CNH é obrigatória',
        });
      } else if (!isAfter(new Date(data.cnhExpiry), startOfDay(new Date()))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cnhExpiry'],
          message: 'CNH vencida. Renove sua habilitação antes de continuar.',
        });
      }
    }

    if (!data.acceptedTerms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['acceptedTerms'],
        message: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.',
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
