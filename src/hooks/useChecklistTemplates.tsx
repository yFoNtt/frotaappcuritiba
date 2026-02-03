import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { INSPECTION_CHECKLIST_TEMPLATE, ChecklistCategory, ChecklistItem } from '@/components/inspections/InspectionChecklist';

export interface ChecklistTemplateItem {
  id: string;
  locador_id: string;
  category_id: string;
  category_title: string;
  item_id: string;
  item_label: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch custom templates for the locador
export function useChecklistTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['checklist-templates', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('inspection_checklist_templates')
        .select('*')
        .eq('locador_id', user.id)
        .order('category_id')
        .order('display_order');

      if (error) {
        console.error('Error fetching checklist templates:', error);
        throw error;
      }

      return data as ChecklistTemplateItem[];
    },
    enabled: !!user,
  });
}

// Get the effective checklist (custom or default)
export function useEffectiveChecklist() {
  const { data: templates, isLoading } = useChecklistTemplates();

  const getChecklist = (): ChecklistCategory[] => {
    if (!templates || templates.length === 0) {
      return JSON.parse(JSON.stringify(INSPECTION_CHECKLIST_TEMPLATE));
    }

    // Group templates by category
    const categoriesMap = new Map<string, { title: string; items: ChecklistItem[] }>();
    
    templates
      .filter(t => t.is_active)
      .forEach(template => {
        if (!categoriesMap.has(template.category_id)) {
          categoriesMap.set(template.category_id, {
            title: template.category_title,
            items: [],
          });
        }
        categoriesMap.get(template.category_id)!.items.push({
          id: template.item_id,
          label: template.item_label,
          status: 'ok',
        });
      });

    return Array.from(categoriesMap.entries()).map(([id, category]) => ({
      id,
      title: category.title,
      items: category.items,
    }));
  };

  return { getChecklist, isLoading, hasCustomTemplate: templates && templates.length > 0 };
}

// Initialize templates from default
export function useInitializeTemplates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const items: Omit<ChecklistTemplateItem, 'id' | 'created_at' | 'updated_at'>[] = [];
      
      INSPECTION_CHECKLIST_TEMPLATE.forEach((category, categoryIndex) => {
        category.items.forEach((item, itemIndex) => {
          items.push({
            locador_id: user.id,
            category_id: category.id,
            category_title: category.title,
            item_id: item.id,
            item_label: item.label,
            display_order: categoryIndex * 100 + itemIndex,
            is_active: true,
          });
        });
      });

      const { error } = await supabase
        .from('inspection_checklist_templates')
        .insert(items);

      if (error) {
        console.error('Error initializing templates:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Template de checklist inicializado com sucesso!');
    },
    onError: (error) => {
      console.error('Error initializing templates:', error);
      toast.error('Erro ao inicializar template');
    },
  });
}

// Add a new item to the checklist
export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      category_id: string; 
      category_title: string;
      item_id: string;
      item_label: string;
      display_order: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('inspection_checklist_templates')
        .insert({
          ...data,
          locador_id: user.id,
          is_active: true,
        });

      if (error) {
        console.error('Error adding checklist item:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Item adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Error adding checklist item:', error);
      toast.error('Erro ao adicionar item');
    },
  });
}

// Update an item
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: string; 
      data: Partial<Pick<ChecklistTemplateItem, 'item_label' | 'display_order' | 'is_active' | 'category_title'>>
    }) => {
      const { error } = await supabase
        .from('inspection_checklist_templates')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Error updating checklist item:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Item atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating checklist item:', error);
      toast.error('Erro ao atualizar item');
    },
  });
}

// Delete an item
export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspection_checklist_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting checklist item:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Item removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting checklist item:', error);
      toast.error('Erro ao remover item');
    },
  });
}

// Add a new category
export function useAddChecklistCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      category_id: string; 
      category_title: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Add a default item to the category
      const { error } = await supabase
        .from('inspection_checklist_templates')
        .insert({
          locador_id: user.id,
          category_id: data.category_id,
          category_title: data.category_title,
          item_id: `${data.category_id}_item_1`,
          item_label: 'Novo item',
          display_order: 0,
          is_active: true,
        });

      if (error) {
        console.error('Error adding checklist category:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Categoria adicionada com sucesso!');
    },
    onError: (error) => {
      console.error('Error adding checklist category:', error);
      toast.error('Erro ao adicionar categoria');
    },
  });
}

// Delete a category (all items in it)
export function useDeleteChecklistCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('inspection_checklist_templates')
        .delete()
        .eq('locador_id', user.id)
        .eq('category_id', categoryId);

      if (error) {
        console.error('Error deleting checklist category:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Categoria removida com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting checklist category:', error);
      toast.error('Erro ao remover categoria');
    },
  });
}

// Reset to default template
export function useResetToDefaultTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const initializeTemplates = useInitializeTemplates();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Delete all existing templates
      const { error } = await supabase
        .from('inspection_checklist_templates')
        .delete()
        .eq('locador_id', user.id);

      if (error) {
        console.error('Error resetting templates:', error);
        throw error;
      }

      // Re-initialize with defaults
      await initializeTemplates.mutateAsync();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Template resetado para o padrão!');
    },
    onError: (error) => {
      console.error('Error resetting templates:', error);
      toast.error('Erro ao resetar template');
    },
  });
}
