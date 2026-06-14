DROP FUNCTION IF EXISTS public.get_public_vehicle(uuid);

CREATE OR REPLACE FUNCTION public.get_public_vehicle(_vehicle_id uuid)
 RETURNS TABLE(id uuid, brand text, model text, year integer, color text, fuel_type text, status text, weekly_price numeric, km_limit integer, excess_km_fee numeric, deposit numeric, allowed_apps text[], description text, images text[], city text, state text, current_km integer, created_at timestamp with time zone, locador_whatsapp text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    v.id, v.brand, v.model, v.year, v.color, v.fuel_type, v.status,
    v.weekly_price, v.km_limit, v.excess_km_fee, v.deposit,
    v.allowed_apps, v.description, v.images, v.city, v.state,
    v.current_km, v.created_at,
    p.whatsapp AS locador_whatsapp
  FROM public.vehicles v
  LEFT JOIN public.profiles p ON p.user_id = v.locador_id
  WHERE v.id = _vehicle_id
    AND v.status = 'available';
$function$;