import { useState } from "react";
import { Sparkles, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PriceSuggestionProps {
  brand: string;
  model: string;
  year: number;
  city: string;
  state: string;
  fuel_type: string;
  km_limit?: number;
  allowed_apps?: string[];
  onApply: (price: number) => void;
}

interface Suggestion {
  suggested_price: number;
  min_price: number;
  max_price: number;
  reasoning: string;
}

export function PriceSuggestion(props: PriceSuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Suggestion | null>(null);

  const canSuggest =
    props.brand && props.model && props.year && props.city && props.state;

  const handleSuggest = async () => {
    if (!canSuggest) {
      toast.error("Preencha marca, modelo, ano e cidade primeiro.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "suggest-vehicle-price",
        {
          body: {
            brand: props.brand,
            model: props.model,
            year: props.year,
            city: props.city,
            state: props.state,
            fuel_type: props.fuel_type,
            km_limit: props.km_limit,
            allowed_apps: props.allowed_apps,
          },
        },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as Suggestion);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Não foi possível gerar sugestão.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-info/30 bg-info-soft/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-info-soft-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Sugestão de preço por IA
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSuggest}
          disabled={loading || !canSuggest}
          className="h-7 text-xs"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : result ? (
            "Recalcular"
          ) : (
            "Calcular"
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-2 text-xs">
          <div className="flex items-baseline gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">Sugerido:</span>
            <span className="text-base font-bold text-foreground">
              R$ {result.suggested_price.toLocaleString("pt-BR")}
            </span>
            <span className="text-muted-foreground">/semana</span>
            <Button
              type="button"
              size="sm"
              variant="link"
              className="ml-auto h-auto p-0 text-xs"
              onClick={() => props.onApply(result.suggested_price)}
            >
              Aplicar
            </Button>
          </div>
          <div className="text-muted-foreground">
            Faixa competitiva:{" "}
            <span className="font-medium text-foreground">
              R$ {result.min_price.toLocaleString("pt-BR")} – R${" "}
              {result.max_price.toLocaleString("pt-BR")}
            </span>
          </div>
          <p className="text-muted-foreground italic">{result.reasoning}</p>
        </div>
      )}
    </div>
  );
}
