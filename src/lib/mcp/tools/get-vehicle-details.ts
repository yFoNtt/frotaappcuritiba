import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_vehicle_details",
  title: "Detalhes de um veículo",
  description:
    "Retorna as informações públicas de um veículo específico do marketplace (specs, preço semanal, apps aceitos, fotos). Placa e dados do locador ficam ocultos.",
  inputSchema: {
    vehicle_id: z.string().uuid().describe("UUID do veículo."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async ({ vehicle_id }) => {
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

    const { data, error } = await supabase
      .from("vehicles")
      .select(
        "id, brand, model, year, color, fuel_type, transmission, category, weekly_price, deposit, km_franchise, excess_km_fee, allowed_apps, description, images, city, state, status, marketplace_active",
      )
      .eq("id", vehicle_id)
      .eq("marketplace_active", true)
      .maybeSingle();

    if (error) {
      return {
        content: [{ type: "text", text: `Erro: ${error.message}` }],
        isError: true,
      };
    }
    if (!data) {
      return {
        content: [
          {
            type: "text",
            text: "Veículo não encontrado ou não está anunciado no marketplace.",
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `${data.brand} ${data.model} ${data.year} (${data.color})
Cidade: ${data.city}/${data.state}
Preço: R$ ${data.weekly_price}/semana — Depósito: R$ ${data.deposit}
Combustível: ${data.fuel_type} — Câmbio: ${data.transmission}
Franquia KM: ${data.km_franchise} — Excedente: R$ ${data.excess_km_fee}/km
Apps aceitos: ${(data.allowed_apps ?? []).join(", ") || "—"}
Status: ${data.status}

${data.description ?? ""}`,
        },
      ],
      structuredContent: { vehicle: data },
    };
  },
});
