-- Add checklist field to vehicle_inspections table
ALTER TABLE public.vehicle_inspections
ADD COLUMN checklist jsonb DEFAULT '{}';

-- Add comment to document the field
COMMENT ON COLUMN public.vehicle_inspections.checklist IS 'JSON object containing checklist items with their status (ok, not_ok, not_applicable)';