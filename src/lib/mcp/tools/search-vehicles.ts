import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_vehicles",
  title: "Buscar veículos no marketplace",
  description:
    "Lista veículos disponíveis no marketplace público do FrotaApp, com filtros opcionais por cidade, faixa de preço semanal e combustível. Retorna apenas dados públicos (sem placa nem dados do locador).",
  inputSchema: {
    city: z.string().optional().describe("Cidade do veículo (ex.: 'Curitiba')."),
    max_weekly_price: z
      .number()
      .positive()
      .optional()
      .describe("Valor semanal máximo em reais."),
    fuel_type: z
      .enum(["flex", "gasoline", "diesel", "electric", "hybrid"])
      .optional()
      .describe("Tipo de combustível."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Número máximo de resultados (padrão 10, máx 50)."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async ({ city, max_weekly_price, fuel_type, limit }) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return {
        content: [{ type: "text", text: "Backend not configured." }],
        isError: true,
      };
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // A tabela `vehicles` bloqueia SELECT direto para a chave anon via RLS.
    // O marketplace público (e esta tool) deve sempre passar pela RPC
    // SECURITY DEFINER `get_public_vehicles`, que já filtra status='available'
    // e nunca expõe placa/locador_id para chamadas anônimas.
    const { data, error } = await supabase.rpc("get_public_vehicles");
    if (error) {
      return {
        content: [{ type: "text", text: `Erro na busca: ${error.message}` }],
        isError: true,
      };
    }

    let rows = data ?? [];
    if (city) {
      const needle = city.toLowerCase();
      rows = rows.filter((v) => v.city?.toLowerCase().includes(needle));
    }
    if (max_weekly_price) {
      rows = rows.filter((v) => v.weekly_price <= max_weekly_price);
    }
    if (fuel_type) {
      rows = rows.filter((v) => v.fuel_type === fuel_type);
    }
    rows = rows.slice(0, limit ?? 10);
    return {
      content: [
        {
          type: "text",
          text:
            rows.length === 0
              ? "Nenhum veículo encontrado com os filtros informados."
              : `${rows.length} veículo(s) encontrado(s):\n\n` +
                rows
                  .map(
                    (v) =>
                      `• ${v.brand} ${v.model} ${v.year} — ${v.city}/${v.state} — R$ ${v.weekly_price}/semana (${v.fuel_type})`,
                  )
                  .join("\n"),
        },
      ],
      structuredContent: { vehicles: rows },
    };
  },
});
