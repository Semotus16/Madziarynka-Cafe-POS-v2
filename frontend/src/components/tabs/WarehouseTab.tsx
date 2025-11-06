import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../../services/api';
import { ingredientsAPI, Ingredient } from '../../services/api';

type WarehouseTabProps = {
  user: User;
};

type WarehouseItem = {
  id: number;
  name: string;
  stock_quantity: number;
  nominal_stock: number;
  unit: string;
  is_active: boolean;
  status?: 'OK' | 'LOW' | 'CRITICAL';
};

export default function WarehouseTab({ user }: WarehouseTabProps) {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
const [formData, setFormData] = useState({
    name: '',
    unit: '',
    stock_quantity: '',
    nominal_stock: '',
  });

  // Load ingredients from API
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        setIsLoading(true);
        const ingredients = await ingredientsAPI.getAll();
setItems(ingredients.map(ingredient => ({
          ...ingredient,
          status: calculateStatus(ingredient.stock_quantity, ingredient.nominal_stock)
        })));
      } catch (error) {
        console.error('Failed to load ingredients:', error);
        toast.error('Błąd podczas ładowania danych magazynu');
      } finally {
        setIsLoading(false);
      }
    };
    loadIngredients();
  }, []);

  const calculateStatus = (current: number, nominal: number = 10000): 'OK' | 'LOW' | 'CRITICAL' => {
    const percentage = (current / nominal) * 100;
    if (percentage < 30) return 'CRITICAL';
    if (percentage < 50) return 'LOW';
    return 'OK';
  };

const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', unit: '', stock_quantity: '', nominal_stock: '' });
    setIsDialogOpen(true);
  };

const handleEdit = (item: WarehouseItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      stock_quantity: item.stock_quantity.toString(),
      nominal_stock: item.nominal_stock.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten składnik?')) {
      return;
    }

    try {
      await ingredientsAPI.delete(id);
      setItems(items.filter((item) => item.id !== id));
      toast.success('Składnik usunięty');
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      toast.error('Błąd podczas usuwania składnika');
    }
  };

const handleSave = async () => {
    if (!formData.name || !formData.unit || !formData.stock_quantity || !formData.nominal_stock) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    const stockQuantity = parseFloat(formData.stock_quantity);
    const nominalStock = parseFloat(formData.nominal_stock);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast.error('Stan magazynu musi być liczbą dodatnią');
      return;
    }
    if (isNaN(nominalStock) || nominalStock < 0) {
      toast.error('Nominalny stan magazynu musi być liczbą dodatnią');
      return;
    }

    try {
      if (editingItem) {
        // Update existing ingredient
        const updatedIngredient = await ingredientsAPI.update(editingItem.id, {
          name: formData.name,
          unit: formData.unit,
          stock_quantity: stockQuantity,
          nominal_stock: nominalStock,
          is_active: true,
        });
        
        setItems(items.map(item =>
          item.id === editingItem.id
            ? { ...updatedIngredient, status: calculateStatus(stockQuantity, nominalStock) }
            : item
        ));
        toast.success('Składnik zaktualizowany');
      } else {
        // Create new ingredient
        const newIngredient = await ingredientsAPI.create({
          name: formData.name,
          unit: formData.unit,
          stock_quantity: stockQuantity,
          nominal_stock: nominalStock,
          is_active: true,
        });
        
        setItems([...items, { ...newIngredient, status: calculateStatus(stockQuantity, nominalStock) }]);
        toast.success('Składnik dodany');
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save ingredient:', error);
      toast.error('Błąd podczas zapisywania składnika');
    }
  };

  const getStatusBadge = (status: WarehouseItem['status']) => {
    switch (status) {
      case 'OK':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'LOW':
        return <Badge className="bg-yellow-100 text-yellow-800">Niski</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800">Krytyczny</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Nieznany</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ładowanie danych magazynu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2>Magazyn</h2>
        <Button onClick={handleAdd} className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4" />
          Dodaj składnik
        </Button>
      </div>

      <Card>
        <Table>
<TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Stan</TableHead>
              <TableHead>Nominalny</TableHead>
              <TableHead>Jednostka</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aktywny</TableHead>
              <TableHead className="w-24">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
{items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.stock_quantity}</TableCell>
                <TableCell>{item.nominal_stock}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? 'Tak' : 'Nie'}
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
            {items.length === 0 && (
<TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Brak składników w magazynie
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edytuj składnik' : 'Dodaj składnik'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nazwa</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Kawa ziarnista"
              />
            </div>

            <div>
              <Label>Stan magazynu</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

<div>
              <Label>Nominalny stan</Label>
              <Input
                type="number"
                value={formData.nominal_stock}
                onChange={(e) => setFormData({ ...formData, nominal_stock: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Jednostka</Label>
              <Select
                value={formData.unit}
onValueChange={(value: string) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz jednostkę" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g (gramy)</SelectItem>
                  <SelectItem value="kg">kg (kilogramy)</SelectItem>
                  <SelectItem value="ml">ml (mililitry)</SelectItem>
                  <SelectItem value="l">l (litry)</SelectItem>
                  <SelectItem value="szt">szt (sztuki)</SelectItem>
                </SelectContent>
              </Select>
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
