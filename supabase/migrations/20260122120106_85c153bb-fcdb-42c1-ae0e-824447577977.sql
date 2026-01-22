-- Create validation functions for Brazilian documents

-- Validate CPF (11 digits with check digits)
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  clean_cpf TEXT;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  remainder1 INTEGER;
  remainder2 INTEGER;
  i INTEGER;
BEGIN
  -- Remove non-numeric characters
  clean_cpf := regexp_replace(cpf, '[^0-9]', '', 'g');
  
  -- CPF must have exactly 11 digits
  IF length(clean_cpf) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for invalid patterns (all same digits)
  IF clean_cpf ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate first check digit
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(clean_cpf, i, 1)::INTEGER * (11 - i));
  END LOOP;
  
  remainder1 := (sum1 * 10) % 11;
  IF remainder1 = 10 OR remainder1 = 11 THEN
    remainder1 := 0;
  END IF;
  
  IF remainder1 != substring(clean_cpf, 10, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate second check digit
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(clean_cpf, i, 1)::INTEGER * (12 - i));
  END LOOP;
  
  remainder2 := (sum2 * 10) % 11;
  IF remainder2 = 10 OR remainder2 = 11 THEN
    remainder2 := 0;
  END IF;
  
  IF remainder2 != substring(clean_cpf, 11, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Validate CNPJ (14 digits with check digits)
CREATE OR REPLACE FUNCTION public.validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  clean_cnpj TEXT;
  weights1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  weights2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  remainder1 INTEGER;
  remainder2 INTEGER;
  i INTEGER;
BEGIN
  -- Remove non-numeric characters
  clean_cnpj := regexp_replace(cnpj, '[^0-9]', '', 'g');
  
  -- CNPJ must have exactly 14 digits
  IF length(clean_cnpj) != 14 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for invalid patterns (all same digits)
  IF clean_cnpj ~ '^(\d)\1{13}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate first check digit
  FOR i IN 1..12 LOOP
    sum1 := sum1 + (substring(clean_cnpj, i, 1)::INTEGER * weights1[i]);
  END LOOP;
  
  remainder1 := sum1 % 11;
  IF remainder1 < 2 THEN
    remainder1 := 0;
  ELSE
    remainder1 := 11 - remainder1;
  END IF;
  
  IF remainder1 != substring(clean_cnpj, 13, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate second check digit
  FOR i IN 1..13 LOOP
    sum2 := sum2 + (substring(clean_cnpj, i, 1)::INTEGER * weights2[i]);
  END LOOP;
  
  remainder2 := sum2 % 11;
  IF remainder2 < 2 THEN
    remainder2 := 0;
  ELSE
    remainder2 := 11 - remainder2;
  END IF;
  
  IF remainder2 != substring(clean_cnpj, 14, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Validate CNH (11 digits with check digits)
CREATE OR REPLACE FUNCTION public.validate_cnh(cnh TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  clean_cnh TEXT;
  dsc INTEGER := 0;
  v1 INTEGER := 0;
  v2 INTEGER := 0;
  resto1 INTEGER;
  resto2 INTEGER;
  i INTEGER;
BEGIN
  -- Remove non-numeric characters
  clean_cnh := regexp_replace(cnh, '[^0-9]', '', 'g');
  
  -- CNH must have exactly 11 digits
  IF length(clean_cnh) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for invalid patterns (all same digits)
  IF clean_cnh ~ '^(\d)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate first check digit
  FOR i IN 1..9 LOOP
    v1 := v1 + (substring(clean_cnh, i, 1)::INTEGER * (10 - i));
  END LOOP;
  
  resto1 := v1 % 11;
  IF resto1 >= 10 THEN
    resto1 := 0;
    dsc := 2;
  END IF;
  
  -- Calculate second check digit
  FOR i IN 1..9 LOOP
    v2 := v2 + (substring(clean_cnh, i, 1)::INTEGER * i);
  END LOOP;
  
  resto2 := (v2 % 11) - dsc;
  IF resto2 < 0 THEN
    resto2 := 0;
  END IF;
  IF resto2 >= 10 THEN
    resto2 := 0;
  END IF;
  
  -- Compare calculated digits with actual check digits
  IF resto1 != substring(clean_cnh, 10, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  IF resto2 != substring(clean_cnh, 11, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create validation trigger function for profiles table
CREATE OR REPLACE FUNCTION public.validate_profile_documents()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  clean_doc TEXT;
BEGIN
  -- Validate document_number if provided
  IF NEW.document_number IS NOT NULL AND NEW.document_number != '' THEN
    clean_doc := regexp_replace(NEW.document_number, '[^0-9]', '', 'g');
    
    -- Check if it's a CPF (11 digits) or CNPJ (14 digits)
    IF length(clean_doc) = 11 THEN
      IF NOT validate_cpf(clean_doc) THEN
        RAISE EXCEPTION 'CPF inválido: %', NEW.document_number;
      END IF;
    ELSIF length(clean_doc) = 14 THEN
      IF NOT validate_cnpj(clean_doc) THEN
        RAISE EXCEPTION 'CNPJ inválido: %', NEW.document_number;
      END IF;
    ELSE
      RAISE EXCEPTION 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)';
    END IF;
  END IF;
  
  -- Validate cnh_number if provided
  IF NEW.cnh_number IS NOT NULL AND NEW.cnh_number != '' THEN
    IF NOT validate_cnh(NEW.cnh_number) THEN
      RAISE EXCEPTION 'CNH inválida: %', NEW.cnh_number;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS validate_profile_documents_trigger ON public.profiles;
CREATE TRIGGER validate_profile_documents_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_documents();

-- Create validation trigger function for drivers table (CNH validation)
CREATE OR REPLACE FUNCTION public.validate_driver_cnh()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate cnh_number (required for drivers)
  IF NEW.cnh_number IS NULL OR NEW.cnh_number = '' THEN
    RAISE EXCEPTION 'CNH é obrigatória para motoristas';
  END IF;
  
  IF NOT validate_cnh(NEW.cnh_number) THEN
    RAISE EXCEPTION 'CNH inválida: %', NEW.cnh_number;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on drivers table
DROP TRIGGER IF EXISTS validate_driver_cnh_trigger ON public.drivers;
CREATE TRIGGER validate_driver_cnh_trigger
  BEFORE INSERT OR UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_driver_cnh();