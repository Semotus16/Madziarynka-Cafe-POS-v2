import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../../services/api';
import { productsAPI, ingredientsAPI, Ingredient, Product, ProductIngredient } from '../../services/api';

type MenuTabProps = {
  user: User;
};

type ProductWithIngredients = Product & {
  bomDisplay?: string;
  ingredients?: ProductIngredient[];
};

type IngredientSelection = ProductIngredient;

export default function MenuTab({ user }: MenuTabProps) {
  const [menuItems, setMenuItems] = useState<ProductWithIngredients[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductWithIngredients | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientSelection[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    group: '',
  });

  // Load products and ingredients on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [products, ingredients] = await Promise.all([
          productsAPI.getAll(),
          ingredientsAPI.getAll()
        ]);
        
        // Load BOM for each product
        const productsWithBOM = await Promise.all(
          products.map(async (product) => {
            const productIngredients = await productsAPI.getIngredients(product.id);
            return {
              ...product,
              ingredients: productIngredients
            };
          })
        );
        
        setMenuItems(productsWithBOM);
        setAvailableIngredients(ingredients);
      } catch (error) {
        console.error('Failed to load menu data:', error);
        toast.error('Błąd podczas ładowania danych menu');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const formatBOM = (product: ProductWithIngredients): string => {
    if (!product.ingredients || product.ingredients.length === 0) {
      return 'Brak składników';
    }
    return product.ingredients.map(ing => 
      `${ing.ingredient_name} ${ing.quantity_needed}${ing.unit}`
    ).join(', ');
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', price: '', group: '' });
    setSelectedIngredients([]);
    setIsDialogOpen(true);
  };

  const handleEdit = async (item: ProductWithIngredients) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      group: item.group,
    });
    
    // Load current ingredients for this product
    try {
      const productIngredients = await productsAPI.getIngredients(item.id);
      setSelectedIngredients(productIngredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        ingredient_name: ing.ingredient_name || '',
        quantity_needed: ing.quantity_needed,
        unit: ing.unit || ''
      })));
    } catch (error) {
      console.error('Failed to load product ingredients:', error);
      setSelectedIngredients([]);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę pozycję menu?')) {
      return;
    }

    try {
      await productsAPI.delete(id);
      setMenuItems(menuItems.filter((item) => item.id !== id));
      toast.success('Pozycja menu usunięta');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Błąd podczas usuwania pozycji menu');
    }
  };

  const addIngredientToProduct = () => {
    const newIngredient: IngredientSelection = {
      ingredient_id: 0,
      ingredient_name: '',
      quantity_needed: 0,
      unit: '',
    };
    setSelectedIngredients([...selectedIngredients, newIngredient]);
  };

  const removeIngredientFromProduct = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientSelection, value: string | number) => {
    const updated = [...selectedIngredients];
    
    if (field === 'ingredient_id') {
      const ingredientId = parseInt(value as string);
      const ingredient = availableIngredients.find(ing => ing.id === ingredientId);
      if (ingredient) {
        updated[index] = {
          ...updated[index],
          ingredient_id: ingredientId,
          ingredient_name: ingredient.name,
          unit: ingredient.unit,
        };
      }
    } else if (field === 'quantity_needed') {
      updated[index] = {
        ...updated[index],
        quantity_needed: parseFloat(value as string) || 0,
      };
    }
    
    setSelectedIngredients(updated);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.group) {
      toast.error('Wypełnij wszystkie wymagane pola');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Cena musi być liczbą dodatnią');
      return;
    }

    // Validate ingredients
    const validIngredients = selectedIngredients.filter(ing => 
      ing.ingredient_id > 0 && ing.quantity_needed > 0
    );

    if (validIngredients.length === 0) {
      toast.error('Dodaj co najmniej jeden składnik');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        price: price,
        group: formData.group,
        ingredients: validIngredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity_needed: ing.quantity_needed,
        })),
      };

      if (editingItem) {
        // Update existing product
        const updatedProduct = await productsAPI.update(editingItem.id, productData);
        
        // Reload BOM for the updated product
        const productIngredients = await productsAPI.getIngredients(updatedProduct.id);
        
        setMenuItems(menuItems.map(item =>
          item.id === editingItem.id
            ? { ...updatedProduct, ingredients: productIngredients }
            : item
        ));
        toast.success('Pozycja menu zaktualizowana');
      } else {
        // Create new product
        const newProduct = await productsAPI.create(productData);
        
        // Load BOM for the new product
        const productIngredients = await productsAPI.getIngredients(newProduct.id);
        
        setMenuItems([...menuItems, { ...newProduct, ingredients: productIngredients }]);
        toast.success('Pozycja menu dodana');
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Błąd podczas zapisywania pozycji menu');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ładowanie danych menu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2>Zarządzanie Menu</h2>
        <Button onClick={handleAdd} className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4" />
          Dodaj pozycję
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Cena</TableHead>
              <TableHead>Grupa</TableHead>
              <TableHead>BOM (Składniki)</TableHead>
              <TableHead>Aktywny</TableHead>
              <TableHead className="w-24">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{parseFloat(item.price.toString()).toFixed(2)} zł</TableCell>
                <TableCell>{item.group}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-sm">
                    {formatBOM(item)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.is_visible ? "default" : "secondary"}>
                    {item.is_visible ? 'Tak' : 'Nie'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {menuItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Brak pozycji w menu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edytuj pozycję menu' : 'Dodaj pozycję menu'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Product Information */}
            <div className="space-y-4">
              <div>
                <Label>Nazwa</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. Espresso"
                />
              </div>

              <div>
                <Label>Cena (zł)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Grupa</Label>
                <Select
                  value={formData.group}
                  onValueChange={(value: string) => setFormData({ ...formData, group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz grupę" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kawa">Kawa</SelectItem>
                    <SelectItem value="Wypieki">Wypieki</SelectItem>
                    <SelectItem value="Desery">Desery</SelectItem>
                    <SelectItem value="Napoje">Napoje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* BOM (Bill of Materials) Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Składniki (BOM)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredientToProduct}
                  className="gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Dodaj składnik
                </Button>
              </div>

              {selectedIngredients.length > 0 ? (
                <div className="space-y-3">
                  {selectedIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-end gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Label>Składnik</Label>
                        <Select
                          value={ingredient.ingredient_id.toString()}
                          onValueChange={(value: string) => updateIngredient(index, 'ingredient_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz składnik" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableIngredients.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id.toString()}>
                                {ing.name} ({ing.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-24">
                        <Label>Ilość</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ingredient.quantity_needed}
                          onChange={(e) => updateIngredient(index, 'quantity_needed', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="w-16">
                        <Label>Jednostka</Label>
                        <Input
                          value={ingredient.unit}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredientFromProduct(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  Brak składników. Kliknij "Dodaj składnik" aby dodać pierwszy składnik.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
