-- TEMPORÁRIO: exceção TESTE/DEMO para teste do fluxo de contratos. Remover ao final.
CREATE OR REPLACE FUNCTION private.is_teste_demo_user(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = _uid AND lower(email) = 'locador.teste@frotaapp.com');
$$;
REVOKE ALL ON FUNCTION private.is_teste_demo_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_teste_demo_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_profile_documents()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE clean_doc TEXT;
BEGIN
  IF NEW.document_number = 'TESTE-DEMO-0001' AND NEW.full_name LIKE 'TESTE %'
     AND private.is_teste_demo_user(NEW.user_id) THEN
    RETURN NEW;
  END IF;
  IF NEW.document_number IS NOT NULL AND NEW.document_number != '' THEN
    clean_doc := regexp_replace(NEW.document_number, '[^0-9]', '', 'g');
    IF length(clean_doc) = 11 THEN
      IF NOT validate_cpf(clean_doc) THEN RAISE EXCEPTION 'CPF inválido: %', NEW.document_number; END IF;
    ELSIF length(clean_doc) = 14 THEN
      IF NOT validate_cnpj(clean_doc) THEN RAISE EXCEPTION 'CNPJ inválido: %', NEW.document_number; END IF;
    ELSE
      RAISE EXCEPTION 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)';
    END IF;
  END IF;
  IF NEW.cnh_number IS NOT NULL AND NEW.cnh_number != '' THEN
    IF NOT validate_cnh(NEW.cnh_number) THEN RAISE EXCEPTION 'CNH inválida: %', NEW.cnh_number; END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_driver_cnh()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.cnh_number = 'TESTE-DEMO-0001' AND NEW.name LIKE 'TESTE %'
     AND NEW.email LIKE '%@teste.frotaapp.invalid'
     AND private.is_teste_demo_user(NEW.locador_id) THEN
    RETURN NEW;
  END IF;
  IF NEW.cnh_number IS NULL OR NEW.cnh_number = '' THEN
    RAISE EXCEPTION 'CNH é obrigatória para motoristas';
  END IF;
  IF NOT validate_cnh(NEW.cnh_number) THEN RAISE EXCEPTION 'CNH inválida: %', NEW.cnh_number; END IF;
  RETURN NEW;
END;
$function$;