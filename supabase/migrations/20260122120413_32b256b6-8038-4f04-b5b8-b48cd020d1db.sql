-- Fix critical security issues: Add explicit denial of public access to sensitive tables

-- 1. DRIVERS TABLE - Protect personal information (emails, phones, CNH)
-- Add policy to deny anonymous/public access
CREATE POLICY "Deny public access to drivers"
ON public.drivers
FOR SELECT
TO anon
USING (false);

-- 2. PROFILES TABLE - Protect identity documents (CPF/CNPJ, CNH)
-- Add policy to deny anonymous/public access
CREATE POLICY "Deny public access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 3. PAYMENTS TABLE - Protect financial data
-- Add policy to deny anonymous/public access
CREATE POLICY "Deny public access to payments"
ON public.payments
FOR SELECT
TO anon
USING (false);

-- 4. CONTRACTS TABLE - Protect business terms and pricing
-- Add policy to deny anonymous/public access
CREATE POLICY "Deny public access to contracts"
ON public.contracts
FOR SELECT
TO anon
USING (false);