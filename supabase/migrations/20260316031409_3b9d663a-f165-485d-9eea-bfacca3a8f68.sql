
-- Allow users to delete their own CNH alerts (dismiss old alerts)
CREATE POLICY "Users can delete their own alerts"
  ON public.cnh_alerts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
