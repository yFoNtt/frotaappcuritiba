-- Create table for custom inspection checklist templates
CREATE TABLE public.inspection_checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locador_id UUID NOT NULL,
  category_id TEXT NOT NULL,
  category_title TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_label TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(locador_id, category_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.inspection_checklist_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for locador access
CREATE POLICY "Locadores can view their templates" 
ON public.inspection_checklist_templates 
FOR SELECT 
USING (locador_id = auth.uid());

CREATE POLICY "Locadores can insert their templates" 
ON public.inspection_checklist_templates 
FOR INSERT 
WITH CHECK (locador_id = auth.uid());

CREATE POLICY "Locadores can update their templates" 
ON public.inspection_checklist_templates 
FOR UPDATE 
USING (locador_id = auth.uid());

CREATE POLICY "Locadores can delete their templates" 
ON public.inspection_checklist_templates 
FOR DELETE 
USING (locador_id = auth.uid());

-- Deny public access
CREATE POLICY "Deny public access to inspection_checklist_templates" 
ON public.inspection_checklist_templates 
FOR SELECT 
USING (false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inspection_checklist_templates_updated_at
BEFORE UPDATE ON public.inspection_checklist_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();