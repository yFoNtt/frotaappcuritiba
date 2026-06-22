-- 1) Realtime: incluir interested_user_id nos participantes do canal de conversa
DROP POLICY IF EXISTS "Conversation participants can read their channel" ON realtime.messages;

CREATE POLICY "Conversation participants can read their channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'conversations:%'
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id::text = split_part(realtime.topic(), ':', 2)
      AND (
        c.locador_id = auth.uid()
        OR c.interested_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.drivers d
          WHERE d.id = c.driver_id AND d.user_id = auth.uid()
        )
      )
  )
);

-- 2) Vehicles: permitir motorista vinculado ler o veículo do contrato ativo
DROP POLICY IF EXISTS "Motoristas can view their assigned vehicle" ON public.vehicles;

CREATE POLICY "Motoristas can view their assigned vehicle"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.contracts ct
    JOIN public.drivers d ON d.id = ct.driver_id
    WHERE ct.vehicle_id = vehicles.id
      AND d.user_id = auth.uid()
      AND ct.status = 'active'
  )
);