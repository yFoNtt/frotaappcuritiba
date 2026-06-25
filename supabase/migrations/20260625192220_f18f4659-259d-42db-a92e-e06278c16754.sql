CREATE OR REPLACE FUNCTION public.vehicle_belongs_to_locador(_vehicle_id uuid, _locador_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = _vehicle_id AND v.locador_id = _locador_id
  )
$$;

REVOKE ALL ON FUNCTION public.vehicle_belongs_to_locador(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vehicle_belongs_to_locador(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Motoristas podem iniciar conversa como interessados" ON public.conversations;

CREATE POLICY "Motoristas podem iniciar conversa como interessados"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    interested_user_id = auth.uid()
    AND driver_id IS NULL
    AND locador_id <> auth.uid()
    AND public.has_role(auth.uid(), 'motorista'::public.app_role)
    AND (
      vehicle_id IS NULL
      OR public.vehicle_belongs_to_locador(vehicle_id, locador_id)
    )
  );