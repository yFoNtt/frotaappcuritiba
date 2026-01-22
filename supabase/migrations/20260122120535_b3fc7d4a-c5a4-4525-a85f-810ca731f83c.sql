-- Fix warn-level security issues: Add explicit denial of public access to remaining sensitive tables

-- 1. DOCUMENTS TABLE - Protect file paths and document metadata
CREATE POLICY "Deny public access to documents"
ON public.documents
FOR SELECT
TO anon
USING (false);

-- 2. DOCUMENT_REQUESTS TABLE - Protect document request details
CREATE POLICY "Deny public access to document_requests"
ON public.document_requests
FOR SELECT
TO anon
USING (false);

-- 3. MAINTENANCES TABLE - Protect maintenance costs and service providers
CREATE POLICY "Deny public access to maintenances"
ON public.maintenances
FOR SELECT
TO anon
USING (false);

-- 4. MILEAGE_RECORDS TABLE - Protect driver activity patterns
CREATE POLICY "Deny public access to mileage_records"
ON public.mileage_records
FOR SELECT
TO anon
USING (false);

-- 5. CNH_ALERTS TABLE - Protect license expiry information
CREATE POLICY "Deny public access to cnh_alerts"
ON public.cnh_alerts
FOR SELECT
TO anon
USING (false);

-- 6. USER_ROLES TABLE - Protect role assignments from enumeration
CREATE POLICY "Deny public access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);