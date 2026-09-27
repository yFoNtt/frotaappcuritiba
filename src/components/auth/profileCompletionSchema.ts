import { isAfter, startOfDay } from 'date-fns';
import { z } from 'zod';
import { validateCNHDocument, validateDocument } from '@/lib/documentValidation';

export const profileCompletionSchema = z
  .object({
    role: z.enum(['locador', 'motorista']),
    document: z.string().optional().default(''),
    cnh: z.string().optional().default(''),
    cnhExpiry: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'locador') {
      const validation = validateDocument(data.document);
      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['document'],
          message: validation.message,
        });
      }
      return;
    }

    const cnhValidation = validateCNHDocument(data.cnh);
    if (!cnhValidation.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cnh'],
        message: cnhValidation.message,
      });
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
  });

export type ProfileCompletionValues = z.infer<typeof profileCompletionSchema>;