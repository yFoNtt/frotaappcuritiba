import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_vehicles",
  title: "Buscar veículos no marketplace",
  description:
    "Lista veículos disponíveis no marketplace público do FrotaApp, com filtros opcionais por cidade, faixa de preço semanal, combustível e câmbio. Retorna dados públicos apenas (sem placa, CPF ou dados do locador).",
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
    transmission: z
      .enum(["manual", "automatic"])
      .optional()
      .describe("Câmbio."),
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
  handler: async ({ city, max_weekly_price, fuel_type, transmission, limit }) => {
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

    let query = supabase
      .from("vehicles")
      .select(
        "id, brand, model, year, color, fuel_type, transmission, weekly_price, km_franchise, city, state, images",
      )
      .eq("status", "available")
      .eq("marketplace_active", true)
      .limit(limit ?? 10);

    if (city) query = query.ilike("city", `%${city}%`);
    if (max_weekly_price) query = query.lte("weekly_price", max_weekly_price);
    if (fuel_type) query = query.eq("fuel_type", fuel_type);
    if (transmission) query = query.eq("transmission", transmission);

    const { data, error } = await query;
    if (error) {
      return {
        content: [{ type: "text", text: `Erro na busca: ${error.message}` }],
        isError: true,
      };
    }

    const rows = data ?? [];
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
                      `• ${v.brand} ${v.model} ${v.year} — ${v.city}/${v.state} — R$ ${v.weekly_price}/semana (${v.fuel_type}, ${v.transmission})`,
                  )
                  .join("\n"),
        },
      ],
      structuredContent: { vehicles: rows },
    };
  },
});
