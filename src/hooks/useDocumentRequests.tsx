import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/sanitize';

export type DocumentRequestStatus = 'pending' | 'approved' | 'rejected';
export type DocumentType = 'cnh' | 'comprovante' | 'contrato' | 'multa' | 'outro';

export interface DocumentRequest {
  id: string;
  locador_id: string;
  driver_id: string;
  document_id: string | null;
  type: DocumentType;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  expires_at: string | null;
  status: DocumentRequestStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRequestInsert {
  locador_id: string;
  driver_id: string;
  document_id?: string | null;
  type: DocumentType;
  name: string;
  file: File;
  description?: string;
  expires_at?: string;
}

// Hook for motorista to manage their document requests
export function useMotoristaDocumentRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['document-requests', 'motorista', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Using type assertion until Supabase types are refreshed
      const { data, error } = await (supabase
        .from('document_requests' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as DocumentRequest[];
    },
    enabled: !!user?.id,
  });

  const submitRequest = useMutation({
    mutationFn: async (input: DocumentRequestInsert) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Generate unique file path in requests folder
      const fileExt = input.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `requests/${input.driver_id}/${input.type}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, input.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert request record
      const { data, error } = await (supabase
        .from('document_requests' as any)
        .insert({
          locador_id: input.locador_id,
          driver_id: input.driver_id,
          document_id: input.document_id || null,
          type: input.type,
          name: input.name,
          file_path: filePath,
          file_size: input.file.size,
          mime_type: input.file.type,
          description: input.description || null,
          expires_at: input.expires_at || null,
          status: 'pending',
        })
        .select()
        .single() as any);

      if (error) {
        // If insert fails, try to delete the uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw error;
      }

      return data as DocumentRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
      toast.success('Solicitação enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Error submitting document request:', error);
      toast.error('Erro ao enviar solicitação');
    },
  });

  return {
    requests: requestsQuery.data || [],
    isLoading: requestsQuery.isLoading,
    error: requestsQuery.error,
    submitRequest,
  };
}

// Hook for locador to manage document requests
export function useLocadorDocumentRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['document-requests', 'locador', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('document_requests' as any)
        .select('*')
        .eq('locador_id', user.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as DocumentRequest[];
    },
    enabled: !!user?.id,
  });

  const approveRequest = useMutation({
    mutationFn: async (request: DocumentRequest) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Move file from requests to approved documents folder
      const newFilePath = `${user.id}/${request.type}/${Date.now()}-${request.file_path.split('/').pop()}`;
      
      // Copy file to new location
      const { error: copyError } = await supabase.storage
        .from('documents')
        .copy(request.file_path, newFilePath);

      if (copyError) {
        console.warn('Error copying file:', copyError);
        // Continue anyway - file might still be accessible
      }

      // Create document record
      const { error: docError } = await (supabase
        .from('documents' as any)
        .insert({
          locador_id: user.id,
          driver_id: request.driver_id,
          type: request.type,
          name: request.name,
          file_path: copyError ? request.file_path : newFilePath,
          file_size: request.file_size,
          mime_type: request.mime_type,
          description: request.description,
          expires_at: request.expires_at,
        }) as any);

      if (docError) throw docError;

      // Update request status
      const { data, error } = await (supabase
        .from('document_requests' as any)
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id)
        .select()
        .single() as any);

      if (error) throw error;

      // Delete old request file if copy was successful
      if (!copyError) {
        await supabase.storage.from('documents').remove([request.file_path]);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento aprovado com sucesso!');
    },
    onError: (error) => {
      console.error('Error approving request:', error);
      toast.error('Erro ao aprovar documento');
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async ({ request, reason }: { request: DocumentRequest; reason: string }) => {
      const { data, error } = await (supabase
        .from('document_requests' as any)
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
      toast.success('Solicitação rejeitada');
    },
    onError: (error) => {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao rejeitar solicitação');
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (request: DocumentRequest) => {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([request.file_path]);

      if (storageError) {
        console.warn('Error deleting file:', storageError);
      }

      // Delete request record
      const { error } = await (supabase
        .from('document_requests' as any)
        .delete()
        .eq('id', request.id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-requests'] });
      toast.success('Solicitação excluída');
    },
    onError: (error) => {
      console.error('Error deleting request:', error);
      toast.error('Erro ao excluir solicitação');
    },
  });

  const getFileUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  return {
    requests: requestsQuery.data || [],
    isLoading: requestsQuery.isLoading,
    error: requestsQuery.error,
    approveRequest,
    rejectRequest,
    deleteRequest,
    getFileUrl,
  };
}
