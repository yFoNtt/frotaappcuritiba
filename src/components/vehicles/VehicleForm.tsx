import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Vehicle } from '@/hooks/useVehicles';
import { PriceSuggestion } from './PriceSuggestion';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const vehicleSchema = z.object({
  brand: z.string().min(1, 'Marca é obrigatória').max(50),
  model: z.string().min(1, 'Modelo é obrigatório').max(50),
  year: z.coerce.number().min(2000, 'Ano mínimo: 2000').max(new Date().getFullYear() + 1),
  plate: z.string().min(7, 'Placa inválida').max(8).toUpperCase(),
  color: z.string().min(1, 'Cor é obrigatória').max(30),
  fuel_type: z.enum(['flex', 'gasoline', 'ethanol', 'diesel', 'electric', 'hybrid']),
  weekly_price: z.coerce.number().min(100, 'Valor mínimo: R$ 100').max(10000),
  km_limit: z.coerce.number().min(500, 'Limite mínimo: 500 km').max(10000),
  excess_km_fee: z.coerce.number().min(0.1, 'Taxa mínima: R$ 0,10').max(5),
  deposit: z.coerce.number().min(0).max(10000),
  city: z.string().min(2, 'Cidade é obrigatória').max(100),
  state: z.string().length(2, 'Use a sigla do estado (ex: SP)').toUpperCase(),
  description: z.string().max(1000).optional(),
  allowed_apps: z.array(z.string()).min(1, 'Selecione pelo menos um aplicativo'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
}

const appOptions = [
  { value: 'Uber', label: 'Uber' },
  { value: '99', label: '99' },
  { value: 'InDriver', label: 'InDriver' },
];

export function VehicleForm({ open, onOpenChange, vehicle }: VehicleFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!vehicle;

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      color: '',
      fuel_type: 'flex',
      weekly_price: 650,
      km_limit: 1500,
      excess_km_fee: 0.5,
      deposit: 500,
      city: '',
      state: '',
      description: '',
      allowed_apps: ['Uber'],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (vehicle && open) {
      form.reset({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        plate: vehicle.plate,
        color: vehicle.color,
        fuel_type: vehicle.fuel_type,
        weekly_price: vehicle.weekly_price,
        km_limit: vehicle.km_limit ?? 1500,
        excess_km_fee: vehicle.excess_km_fee ?? 0.5,
        deposit: vehicle.deposit ?? 500,
        city: vehicle.city,
        state: vehicle.state,
        description: vehicle.description ?? '',
        allowed_apps: vehicle.allowed_apps ?? ['Uber'],
      });
      setExistingImages(vehicle.images ?? []);
      setNewImages([]);
      setNewImagePreviews([]);
    } else if (!vehicle && open) {
      form.reset({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        plate: '',
        color: '',
        fuel_type: 'flex',
        weekly_price: 650,
        km_limit: 1500,
        excess_km_fee: 0.5,
        deposit: 500,
        city: '',
        state: '',
        description: '',
        allowed_apps: ['Uber'],
      });
      setExistingImages([]);
      setNewImages([]);
      setNewImagePreviews([]);
    }
  }, [vehicle, open, form]);

  const totalImages = existingImages.length + newImages.length;

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Formato não suportado. Use JPG, PNG ou WebP.`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Arquivo muito grande. Máximo 5MB.`);
        return false;
      }
      return true;
    });

    const currentTotal = existingImages.length + newImages.length;
    if (currentTotal + validFiles.length > 5) {
      toast.error('Máximo de 5 imagens permitido');
      return;
    }

    setNewImages((prev) => [...prev, ...validFiles]);
    
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [existingImages.length, newImages.length]);

  const removeExistingImage = useCallback((index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeNewImage = useCallback((index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of newImages) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erro ao fazer upload: ${file.name}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: VehicleFormData) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    const totalImagesCount = existingImages.length + newImages.length;
    if (totalImagesCount === 0) {
      toast.error('Adicione pelo menos uma foto do veículo');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload new images
      const newImageUrls = newImages.length > 0 ? await uploadImages(user.id) : [];
      const allImages = [...existingImages, ...newImageUrls];

      if (isEditing && vehicle) {
        // Update existing vehicle
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            brand: data.brand,
            model: data.model,
            year: data.year,
            plate: data.plate,
            color: data.color,
            fuel_type: data.fuel_type,
            weekly_price: data.weekly_price,
            km_limit: data.km_limit,
            excess_km_fee: data.excess_km_fee,
            deposit: data.deposit,
            city: data.city,
            state: data.state,
            description: data.description || null,
            allowed_apps: data.allowed_apps,
            images: allImages,
          })
          .eq('id', vehicle.id);

        if (updateError) throw updateError;
        toast.success('Veículo atualizado com sucesso!');
      } else {
        // Create new vehicle
        const { error: insertError } = await supabase.from('vehicles').insert({
          locador_id: user.id,
          brand: data.brand,
          model: data.model,
          year: data.year,
          plate: data.plate,
          color: data.color,
          fuel_type: data.fuel_type,
          weekly_price: data.weekly_price,
          km_limit: data.km_limit,
          excess_km_fee: data.excess_km_fee,
          deposit: data.deposit,
          city: data.city,
          state: data.state,
          description: data.description || null,
          allowed_apps: data.allowed_apps,
          images: allImages,
          status: 'available',
        });

        if (insertError) throw insertError;
        toast.success('Veículo cadastrado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      handleClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error(isEditing ? 'Erro ao atualizar veículo.' : 'Erro ao cadastrar veículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setNewImages([]);
      setNewImagePreviews([]);
      setExistingImages([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados do veículo.'
              : 'Preencha os dados do veículo para adicioná-lo à sua frota.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-3">
              <Label>Fotos do Veículo *</Label>
              <div className="grid grid-cols-5 gap-2">
                {/* Existing images */}
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {/* New image previews */}
                {newImagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {/* Add button */}
                {totalImages < 5 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">Adicionar</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo 5 fotos. Formatos: JPG, PNG ou WebP. Tamanho máximo: 5MB cada.
              </p>
            </div>

            {/* Vehicle Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Chevrolet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Onix Plus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC1D23" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor *</FormLabel>
                    <FormControl>
                      <Input placeholder="Prata" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combustível *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="gasoline">Gasolina</SelectItem>
                        <SelectItem value="ethanol">Etanol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Elétrico</SelectItem>
                        <SelectItem value="hybrid">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing */}
            <PriceSuggestion
              brand={form.watch('brand')}
              model={form.watch('model')}
              year={form.watch('year')}
              city={form.watch('city')}
              state={form.watch('state')}
              fuel_type={form.watch('fuel_type')}
              km_limit={form.watch('km_limit')}
              allowed_apps={form.watch('allowed_apps')}
              onApply={(price) => form.setValue('weekly_price', price, { shouldValidate: true, shouldDirty: true })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="weekly_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Semanal (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="km_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Km/Mês *</FormLabel>
                    <FormControl>
                      <Input type="number" step="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="excess_km_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa Excesso Km (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.05" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caução (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" maxLength={2} {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o veículo..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Allowed Apps */}
            <FormField
              control={form.control}
              name="allowed_apps"
              render={() => (
                <FormItem>
                  <FormLabel>Aplicativos Permitidos *</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    {appOptions.map((app) => (
                      <FormField
                        key={app.value}
                        control={form.control}
                        name="allowed_apps"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(app.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, app.value]);
                                  } else {
                                    field.onChange(current.filter((v) => v !== app.value));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">{app.label}</FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Salvando...' : 'Cadastrando...'}
                  </>
                ) : isEditing ? (
                  'Salvar Alterações'
                ) : (
                  'Cadastrar Veículo'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
