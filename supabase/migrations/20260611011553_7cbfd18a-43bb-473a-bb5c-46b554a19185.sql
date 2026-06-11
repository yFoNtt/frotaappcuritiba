CREATE OR REPLACE FUNCTION public.get_public_vehicles_by_locador(_locador_id uuid)
RETURNS TABLE(id uuid, brand text, model text, year integer, color text, fuel_type text, status text, weekly_price numeric, km_limit integer, excess_km_fee numeric, deposit numeric, allowed_apps text[], description text, images text[], city text, state text, current_km integer, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    v.id, v.brand, v.model, v.year, v.color, v.fuel_type, v.status,
    v.weekly_price, v.km_limit, v.excess_km_fee, v.deposit,
    v.allowed_apps, v.description, v.images, v.city, v.state,
    v.current_km, v.created_at
  FROM public.vehicles v
  WHERE v.locador_id = _locador_id
    AND v.status = 'available'
  ORDER BY v.created_at DESC;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_vehicles_by_locador(uuid) TO anon, authenticated;