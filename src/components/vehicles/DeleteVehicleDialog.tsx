import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Vehicle } from '@/hooks/useVehicles';

interface DeleteVehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteVehicleDialog({ vehicle, open, onOpenChange }: DeleteVehicleDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!vehicle) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicle.id);

      if (error) throw error;

      // Optionally delete images from storage
      if (vehicle.images && vehicle.images.length > 0) {
        const filePaths = vehicle.images
          .map((url) => {
            // Extract path from URL
            const match = url.match(/vehicle-images\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean) as string[];

        if (filePaths.length > 0) {
          await supabase.storage.from('vehicle-images').remove(filePaths);
        }
      }

      toast.success('Veículo excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Erro ao excluir veículo. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!vehicle) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o veículo{' '}
            <span className="font-semibold text-foreground">
              {vehicle.brand} {vehicle.model}
            </span>{' '}
            (placa {vehicle.plate})? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
