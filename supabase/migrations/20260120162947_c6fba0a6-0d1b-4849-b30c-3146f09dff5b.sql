-- Create contracts table for rental agreements
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locador_id UUID NOT NULL,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  weekly_price NUMERIC NOT NULL,
  deposit NUMERIC DEFAULT 0,
  km_limit INTEGER,
  excess_km_fee NUMERIC,
  payment_day TEXT NOT NULL DEFAULT 'segunda-feira',
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled', 'pending')),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Locadores can view their own contracts
CREATE POLICY "Locadores can view their contracts"
ON public.contracts
FOR SELECT
USING (locador_id = auth.uid());

-- Locadores can insert their own contracts
CREATE POLICY "Locadores can insert their contracts"
ON public.contracts
FOR INSERT
WITH CHECK (locador_id = auth.uid());

-- Locadores can update their own contracts
CREATE POLICY "Locadores can update their contracts"
ON public.contracts
FOR UPDATE
USING (locador_id = auth.uid());

-- Locadores can delete their own contracts (only pending ones)
CREATE POLICY "Locadores can delete pending contracts"
ON public.contracts
FOR DELETE
USING (locador_id = auth.uid() AND status = 'pending');

-- Admins can view all contracts
CREATE POLICY "Admins can view all contracts"
ON public.contracts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Motoristas can view their own contracts (via driver_id -> user_id)
CREATE POLICY "Motoristas can view their contracts"
ON public.contracts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE drivers.id = contracts.driver_id 
    AND drivers.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Add indexes for faster lookups
CREATE INDEX idx_contracts_locador_id ON public.contracts(locador_id);
CREATE INDEX idx_contracts_driver_id ON public.contracts(driver_id);
CREATE INDEX idx_contracts_vehicle_id ON public.contracts(vehicle_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);