import { z } from "npm:zod@3.25.76";

export { z };

export async function parseJsonBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
  options: { allowEmpty?: boolean } = {},
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
  const text = await req.text();
  let payload: unknown = {};

  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      return { success: false, error: "JSON inválido" };
    }
  } else if (!options.allowEmpty) {
    return { success: false, error: "Corpo da requisição obrigatório" };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Payload inválido" };
  }
  return { success: true, data: parsed.data };
}

export const emptyBodySchema = z.object({}).strict();