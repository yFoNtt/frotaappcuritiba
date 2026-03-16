import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/sanitize';

export type DocumentType = 'cnh' | 'comprovante' | 'contrato' | 'multa' | 'outro';

export interface Document {
  id: string;
  locador_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  contract_id: string | null;
  type: DocumentType;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentInsert {
  driver_id?: string | null;
  vehicle_id?: string | null;
  contract_id?: string | null;
  type: DocumentType;
  name: string;
  file: File;
  description?: string;
  expires_at?: string;
}

export function useDocuments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Using type assertion until Supabase types are refreshed
      const { data, error } = await (supabase
        .from('documents' as any)
        .select('*')
        .eq('locador_id', user.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as Document[];
    },
    enabled: !!user?.id,
  });

  const uploadDocument = useMutation({
    mutationFn: async (input: DocumentInsert) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Generate unique file path
      const fileExt = input.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${input.type}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, input.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert document record - using type assertion until types refresh
      const { data, error } = await (supabase
        .from('documents' as any)
        .insert({
          locador_id: user.id,
          driver_id: input.driver_id || null,
          vehicle_id: input.vehicle_id || null,
          contract_id: input.contract_id || null,
          type: input.type,
          name: input.name,
          file_path: filePath,
          file_size: input.file.size,
          mime_type: input.file.type,
          description: input.description || null,
          expires_at: input.expires_at || null,
        })
        .select()
        .single() as any);

      if (error) {
        // If insert fails, try to delete the uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw error;
      }

      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Error uploading document:', error);
      toast.error('Erro ao enviar documento');
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: Document) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }

      // Delete record - using type assertion until types refresh
      const { error } = await (supabase
        .from('documents' as any)
        .delete()
        .eq('id', document.id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error('Erro ao excluir documento');
    },
  });

  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
  };
}

export function useDocumentsByDriver(driverId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', 'driver', driverId],
    queryFn: async () => {
      if (!user?.id || !driverId) return [];
      
      // Using type assertion until Supabase types are refreshed
      const { data, error } = await (supabase
        .from('documents' as any)
        .select('*')
        .eq('locador_id', user.id)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as Document[];
    },
    enabled: !!user?.id && !!driverId,
  });
}

export function useDocumentsByVehicle(vehicleId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', 'vehicle', vehicleId],
    queryFn: async () => {
      if (!user?.id || !vehicleId) return [];
      
      // Using type assertion until Supabase types are refreshed
      const { data, error } = await (supabase
        .from('documents' as any)
        .select('*')
        .eq('locador_id', user.id)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as Document[];
    },
    enabled: !!user?.id && !!vehicleId,
  });
}
