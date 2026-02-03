import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  RotateCcw, 
  GripVertical,
  FolderPlus,
  Settings2
} from 'lucide-react';
import {
  useChecklistTemplates,
  useInitializeTemplates,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useAddChecklistCategory,
  useDeleteChecklistCategory,
  useResetToDefaultTemplate,
  ChecklistTemplateItem,
} from '@/hooks/useChecklistTemplates';

export function ChecklistTemplateEditor() {
  const { data: templates, isLoading } = useChecklistTemplates();
  const initializeTemplates = useInitializeTemplates();
  const addItem = useAddChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  const addCategory = useAddChecklistCategory();
  const deleteCategory = useDeleteChecklistCategory();
  const resetToDefault = useResetToDefaultTemplate();

  const [editingItem, setEditingItem] = useState<ChecklistTemplateItem | null>(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const hasTemplates = templates && templates.length > 0;

  // Group templates by category
  const categoriesMap = new Map<string, { title: string; items: ChecklistTemplateItem[] }>();
  templates?.forEach(template => {
    if (!categoriesMap.has(template.category_id)) {
      categoriesMap.set(template.category_id, {
        title: template.category_title,
        items: [],
      });
    }
    categoriesMap.get(template.category_id)!.items.push(template);
  });

  const categories = Array.from(categoriesMap.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));

  const handleInitialize = () => {
    initializeTemplates.mutate();
  };

  const handleAddItem = (categoryId: string, categoryTitle: string) => {
    if (!newItemLabel.trim()) return;
    
    const existingItems = categoriesMap.get(categoryId)?.items || [];
    const maxOrder = Math.max(...existingItems.map(i => i.display_order), -1);
    
    addItem.mutate({
      category_id: categoryId,
      category_title: categoryTitle,
      item_id: `${categoryId}_custom_${Date.now()}`,
      item_label: newItemLabel.trim(),
      display_order: maxOrder + 1,
    });
    
    setNewItemLabel('');
    setAddingToCategory(null);
  };

  const handleUpdateItemLabel = () => {
    if (!editingItem || !newItemLabel.trim()) return;
    
    updateItem.mutate({
      id: editingItem.id,
      data: { item_label: newItemLabel.trim() },
    });
    
    setEditingItem(null);
    setNewItemLabel('');
  };

  const handleToggleItem = (item: ChecklistTemplateItem) => {
    updateItem.mutate({
      id: item.id,
      data: { is_active: !item.is_active },
    });
  };

  const handleDeleteItem = (id: string) => {
    deleteItem.mutate(id);
  };

  const handleAddCategory = () => {
    if (!newCategoryTitle.trim()) return;
    
    const categoryId = `custom_${Date.now()}`;
    addCategory.mutate({
      category_id: categoryId,
      category_title: newCategoryTitle.trim(),
    });
    
    setNewCategoryTitle('');
    setIsAddCategoryOpen(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory.mutate(categoryId);
  };

  const handleReset = () => {
    resetToDefault.mutate();
  };

  if (!hasTemplates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurar Checklist de Vistoria
          </CardTitle>
          <CardDescription>
            Personalize os itens que serão verificados durante as vistorias dos seus veículos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground mb-4">
            Você ainda não configurou um template de checklist personalizado.
            Clique abaixo para iniciar com o template padrão e depois personalizá-lo.
          </p>
          <Button onClick={handleInitialize} disabled={initializeTemplates.isPending}>
            {initializeTemplates.isPending ? 'Inicializando...' : 'Iniciar Personalização'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Template de Checklist</h3>
          <p className="text-sm text-muted-foreground">
            Personalize os itens do checklist de vistoria
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogDescription>
                  Adicione uma nova categoria ao checklist de vistoria.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="category-title">Nome da Categoria</Label>
                <Input
                  id="category-title"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  placeholder="Ex: Equipamentos de Segurança"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCategory} disabled={!newCategoryTitle.trim()}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resetar Template?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá apagar todas as suas personalizações e restaurar o template padrão.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Resetar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              {category.title}
              <span className="text-xs text-muted-foreground font-normal">
                ({category.items.filter(i => i.is_active).length} ativos)
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog 
                open={addingToCategory === category.id} 
                onOpenChange={(open) => {
                  setAddingToCategory(open ? category.id : null);
                  if (!open) setNewItemLabel('');
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Item</DialogTitle>
                    <DialogDescription>
                      Adicione um novo item à categoria "{category.title}".
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="item-label">Nome do Item</Label>
                    <Input
                      id="item-label"
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      placeholder="Ex: GPS funcionando"
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddingToCategory(null)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => handleAddItem(category.id, category.title)} 
                      disabled={!newItemLabel.trim()}
                    >
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Categoria?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá remover a categoria "{category.title}" e todos os seus itens.
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="space-y-1">
              {category.items
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => handleToggleItem(item)}
                    />
                    <span className={item.is_active ? '' : 'text-muted-foreground line-through'}>
                      {item.item_label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog 
                      open={editingItem?.id === item.id} 
                      onOpenChange={(open) => {
                        if (open) {
                          setEditingItem(item);
                          setNewItemLabel(item.item_label);
                        } else {
                          setEditingItem(null);
                          setNewItemLabel('');
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Item</DialogTitle>
                          <DialogDescription>
                            Altere o nome do item do checklist.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="edit-item-label">Nome do Item</Label>
                          <Input
                            id="edit-item-label"
                            value={newItemLabel}
                            onChange={(e) => setNewItemLabel(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingItem(null)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleUpdateItemLabel} 
                            disabled={!newItemLabel.trim()}
                          >
                            Salvar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso irá remover o item "{item.item_label}" do checklist.
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteItem(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
