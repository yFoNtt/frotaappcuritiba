import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  brand: string;
  model: string;
  year: number;
  city: string;
  state: string;
  fuel_type: string;
  km_limit?: number;
  allowed_apps?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body.brand || !body.model || !body.year || !body.city) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch market average from existing public vehicles
    const { data: marketData } = await supabase.rpc("get_public_vehicles");
    type PublicVehicle = {
      brand: string;
      model: string;
      city: string;
      state: string;
      year: number;
      weekly_price: number;
    };
    const all = (marketData ?? []) as PublicVehicle[];
    const sameModel = all.filter(
      (v) =>
        v.brand?.toLowerCase() === body.brand.toLowerCase() &&
        v.model?.toLowerCase() === body.model.toLowerCase(),
    );
    const sameCity = all.filter(
      (v) => v.city?.toLowerCase() === body.city.toLowerCase(),
    );
    const avg = (arr: PublicVehicle[]) =>
      arr.length
        ? Math.round(arr.reduce((s, v) => s + Number(v.weekly_price), 0) / arr.length)
        : null;

    const marketContext = {
      same_model_count: sameModel.length,
      same_model_avg: avg(sameModel),
      same_city_count: sameCity.length,
      same_city_avg: avg(sameCity),
      overall_count: all.length,
      overall_avg: avg(all),
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um especialista em precificação de aluguel semanal de veículos para motoristas de aplicativo (Uber, 99, InDrive) no Brasil.
Avalie o veículo informado considerando: marca, modelo, ano, cidade, combustível, km mensal liberada, apps permitidos e a média de mercado fornecida.
Retorne SEMPRE via tool call. Faixa típica: R$ 400 a R$ 1.400/semana. Justifique de forma curta e prática.`;

    const userPrompt = `Veículo:
- ${body.brand} ${body.model} ${body.year}
- Combustível: ${body.fuel_type}
- Cidade: ${body.city}/${body.state}
- Km/mês: ${body.km_limit ?? "não informado"}
- Apps: ${(body.allowed_apps ?? []).join(", ") || "não informado"}

Mercado atual:
${JSON.stringify(marketContext, null, 2)}

Sugira o preço semanal ideal e uma faixa min/max competitiva.`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_price",
                description: "Retorna o preço semanal sugerido em reais.",
                parameters: {
                  type: "object",
                  properties: {
                    suggested_price: {
                      type: "number",
                      description: "Preço semanal recomendado em R$.",
                    },
                    min_price: { type: "number" },
                    max_price: { type: "number" },
                    reasoning: {
                      type: "string",
                      description: "Justificativa curta (máx 2 frases).",
                    },
                  },
                  required: ["suggested_price", "min_price", "max_price", "reasoning"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "suggest_price" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall =
      aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No suggestion returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall);
    return new Response(
      JSON.stringify({ ...parsed, market: marketContext }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("suggest-vehicle-price error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
