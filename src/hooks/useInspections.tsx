import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ChecklistStatus = 'ok' | 'not_ok' | 'not_applicable';

export interface VehicleInspection {
  id: string;
  vehicle_id: string;
  driver_id: string;
  contract_id: string | null;
  locador_id: string;
  type: 'check_in' | 'check_out';
  km_reading: number;
  fuel_level: 'empty' | 'quarter' | 'half' | 'three_quarters' | 'full';
  exterior_condition: 'excellent' | 'good' | 'fair' | 'poor';
  interior_condition: 'excellent' | 'good' | 'fair' | 'poor';
  tires_condition: 'excellent' | 'good' | 'fair' | 'poor' | null;
  lights_working: boolean;
  ac_working: boolean;
  damages: string | null;
  notes: string | null;
  photos: string[];
  checklist: Record<string, ChecklistStatus> | null;
  performed_at: string;
  created_at: string;
  updated_at: string;
}

export type InspectionFormData = Omit<VehicleInspection, 'id' | 'locador_id' | 'created_at' | 'updated_at'> & {
  checklist?: Record<string, ChecklistStatus> | null;
};

export const FUEL_LEVELS = {
  empty: 'Vazio',
  quarter: '1/4',
  half: '1/2',
  three_quarters: '3/4',
  full: 'Cheio',
} as const;

export const CONDITION_LABELS = {
  excellent: 'Excelente',
  good: 'Bom',
  fair: 'Regular',
  poor: 'Ruim',
} as const;

export const INSPECTION_TYPES = {
  check_in: 'Check-in (Entrega)',
  check_out: 'Check-out (Devolução)',
} as const;

// Fetch all inspections for the locador
export function useLocadorInspections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['inspections', 'locador', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .eq('locador_id', user.id)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching inspections:', error);
        throw error;
      }

      return data as VehicleInspection[];
    },
    enabled: !!user,
  });
}

// Fetch inspections for a specific vehicle
export function useVehicleInspections(vehicleId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['inspections', 'vehicle', vehicleId],
    queryFn: async () => {
      if (!user || !vehicleId) return [];

      const { data, error } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicle inspections:', error);
        throw error;
      }

      return data as VehicleInspection[];
    },
    enabled: !!user && !!vehicleId,
  });
}

// Create inspection mutation
export function useCreateInspection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: InspectionFormData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: inspection, error } = await supabase
        .from('vehicle_inspections')
        .insert({
          ...data,
          locador_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating inspection:', error);
        throw error;
      }

      return inspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Vistoria registrada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating inspection:', error);
      toast.error('Erro ao registrar vistoria');
    },
  });
}

// Update inspection mutation
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InspectionFormData> }) => {
      const { data: inspection, error } = await supabase
        .from('vehicle_inspections')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating inspection:', error);
        throw error;
      }

      return inspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Vistoria atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating inspection:', error);
      toast.error('Erro ao atualizar vistoria');
    },
  });
}

// Delete inspection mutation
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicle_inspections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting inspection:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Vistoria excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting inspection:', error);
      toast.error('Erro ao excluir vistoria');
    },
  });
}

// Upload inspection photos - stores file paths (not URLs) for private bucket
export async function uploadInspectionPhotos(
  userId: string,
  inspectionId: string,
  files: File[]
): Promise<string[]> {
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${inspectionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      throw uploadError;
    }

    uploadedPaths.push(fileName);
  }

  return uploadedPaths;
}

// Helper: extract storage path from a full public/signed URL or return as-is if already a path
function extractStoragePath(photoRef: string): string {
  if (!photoRef.startsWith('http')) return photoRef;
  const match = photoRef.match(/\/(?:object\/(?:public|sign)|storage\/v1\/object\/(?:public|sign))\/inspection-photos\/(.+?)(?:\?.*)?$/);
  return match ? match[1] : photoRef;
}

// Generate signed URLs for an array of photo references (paths or legacy URLs)
export async function getSignedPhotoUrls(photos: string[]): Promise<string[]> {
  if (!photos || photos.length === 0) return [];

  const paths = photos.map(extractStoragePath);

  const { data, error } = await supabase.storage
    .from('inspection-photos')
    .createSignedUrls(paths, 60 * 60); // 1 hour expiry

  if (error) {
    console.error('Error creating signed URLs:', error);
    return [];
  }

  return data.map(item => item.signedUrl);
}
