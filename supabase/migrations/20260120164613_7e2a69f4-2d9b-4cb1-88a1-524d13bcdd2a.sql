-- Create payments table for weekly charges
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locador_id UUID NOT NULL,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  reference_week DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_payments_locador ON public.payments(locador_id);
CREATE INDEX idx_payments_driver ON public.payments(driver_id);
CREATE INDEX idx_payments_contract ON public.payments(contract_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);

-- RLS Policies
CREATE POLICY "Locadores can view their payments"
  ON public.payments FOR SELECT
  USING (locador_id = auth.uid());

CREATE POLICY "Locadores can insert their payments"
  ON public.payments FOR INSERT
  WITH CHECK (locador_id = auth.uid());

CREATE POLICY "Locadores can update their payments"
  ON public.payments FOR UPDATE
  USING (locador_id = auth.uid());

CREATE POLICY "Locadores can delete pending payments"
  ON public.payments FOR DELETE
  USING (locador_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Motoristas can view their payments"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM drivers 
    WHERE drivers.id = payments.driver_id 
    AND drivers.user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();