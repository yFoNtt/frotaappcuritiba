-- =========================================================
-- Fase 2 — Segurança: REVOKE seletivo + WITH CHECK em policies UPDATE
-- =========================================================

-- 1) Funções internas (triggers, manutenção, admin-only): revogar de PUBLIC/anon/authenticated
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'audit_trigger_func()',
    'update_conversation_on_message()',
    'notify_locador_on_driver_change()',
    'update_vehicle_current_km()',
    'update_updated_at_column()',
    'update_profiles_updated_at()',
    'validate_profile_documents()',
    'validate_driver_cnh()',
    'cleanup_old_login_attempts()',
    'insert_cnh_alert(uuid, text, date)',
    'get_user_emails_for_admin()'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;
END$$;

-- 2) Funções de auth/perfil: apenas authenticated
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'has_role(uuid, app_role)',
    'get_user_role(uuid)',
    'assign_initial_role(app_role)',
    'delete_own_account()'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;
END$$;

-- 3) Funções públicas do marketplace e validadores puros: manter acesso amplo
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'get_public_vehicle(uuid)',
    'get_public_vehicles()',
    'get_public_vehicles_by_locador(uuid)',
    'validate_cpf(text)',
    'validate_cnpj(text)',
    'validate_cnh(text)'
  ]
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;
END$$;

-- =========================================================
-- 4) Policies UPDATE faltando WITH CHECK
-- =========================================================

-- 4a) inspection_checklist_templates
DROP POLICY IF EXISTS "Locadores can update their templates" ON public.inspection_checklist_templates;
CREATE POLICY "Locadores can update their templates"
ON public.inspection_checklist_templates
FOR UPDATE
TO authenticated
USING (locador_id = auth.uid())
WITH CHECK (locador_id = auth.uid());

-- 4b) mileage_records — locador owns via vehicle
DROP POLICY IF EXISTS "Locadores can update their mileage records" ON public.mileage_records;
CREATE POLICY "Locadores can update their mileage records"
ON public.mileage_records
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = mileage_records.vehicle_id AND v.locador_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = mileage_records.vehicle_id AND v.locador_id = auth.uid()
  )
);

-- 4c) user_roles — admin only, com WITH CHECK
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND role <> 'admin'::public.app_role  -- impede escalada para admin via UPDATE
);
