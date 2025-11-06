import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../../services/api';
import { ingredientsAPI, Ingredient } from '../../services/api';

type WarehouseTabProps = { user: User };
type WarehouseItem = Ingredient & { status?: 'OK' | 'LOW' | 'CRITICAL' };

const EMPTY_FORM_STATE: Partial<Ingredient> = {
  name: '', stock_quantity: 0, nominal_stock: 1000, unit: 'g', is_active: true,
};

export default function WarehouseTab({ user }: WarehouseTabProps) {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<Partial<Ingredient> | null>(null);

  const loadIngredients = async () => {
    try {
      const data = await ingredientsAPI.getAll();
      setItems(
        data.map((ing) => {
          const stock = parseFloat(String(ing.stock_quantity)) || 0;
          const nominal = parseFloat(String(ing.nominal_stock)) || 0;
          return { ...ing, stock_quantity: stock, nominal_stock: nominal, status: calculateStatus(stock, nominal) };
        })
      );
    } catch (error) {
      toast.error('Nie udało się załadować danych magazynu.');
      console.error('Failed to load ingredients:', error);
    }
  };

  useEffect(() => { loadIngredients(); }, []);

  const calculateStatus = (current: number, nominal: number): 'OK' | 'LOW' | 'CRITICAL' => {
    if (nominal <= 0) return 'OK';
    const percentage = (current / nominal) * 100;
    if (percentage <= 20) return 'CRITICAL';
    if (percentage <= 50) return 'LOW';
    return 'OK';
  };

  const handleAdd = () => {
    setFormState(EMPTY_FORM_STATE);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: WarehouseItem) => {
    setFormState({ ...item });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await ingredientsAPI.deactivate(id, user);
      toast.success('Składnik został usunięty.');
      loadIngredients();
    } catch (error) { toast.error('Nie udało się usunąć składnika.'); }
  };

  const handleSave = async () => {
    if (!formState || !formState.name || !formState.unit) {
      toast.error('Nazwa i jednostka są wymagane.');
      return;
    }
    try {
      if (formState.id) {
        await ingredientsAPI.update(formState.id, { ...formState, user } as Ingredient, user);
        toast.success('Składnik został zaktualizowany.');
      } else {
        await ingredientsAPI.create({ ...formState, user } as Ingredient, user);
        toast.success('Nowy składnik został dodany.');
      }
      setIsDialogOpen(false);
      loadIngredients();
    } catch (error) { toast.error('Wystąpił błąd podczas zapisywania.'); }
  };
  
  const handleFormChange = (field: keyof Ingredient, value: string) => {
    if (!formState) return;
    const isNum = ['stock_quantity', 'nominal_stock'].includes(field as string);
    setFormState({ ...formState, [field]: isNum ? parseFloat(value) || 0 : value });
  };
  
  const getStatusBadge = (status?: 'OK' | 'LOW' | 'CRITICAL') => {
    switch (status) {
      case 'OK': return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'LOW': return <Badge className="bg-yellow-100 text-yellow-800">Niski stan</Badge>;
      case 'CRITICAL': return <Badge className="bg-red-100 text-red-800">Krytyczny</Badge>;
      default: return <Badge>Brak</Badge>;
    }
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Magazyn</h2>
        <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" /> Dodaj</Button>
      </div>
      <div className="border rounded-lg overflow-auto flex-1">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Stan w magazynie</TableHead>
            <TableHead>Stan nominalny</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.stock_quantity.toFixed(2)} {item.unit}</TableCell>
                <TableCell>{item.nominal_stock.toFixed(2)} {item.unit}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}><DialogContent>
        <DialogHeader><DialogTitle>{formState?.id ? 'Edytuj składnik' : 'Nowy składnik'}</DialogTitle></DialogHeader>
        {formState && (<>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa</Label>
              <Input id="name" value={formState.name ?? ''} onChange={(e) => handleFormChange('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Ilość</Label>
                <Input id="stock" type="number" value={formState.stock_quantity ?? 0} onChange={(e) => handleFormChange('stock_quantity', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nominal_stock">Ilość nominalna</Label>
                <Input id="nominal_stock" type="number" value={formState.nominal_stock ?? 1000} onChange={(e) => handleFormChange('nominal_stock', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Jednostka</Label>
                <Input id="unit" value={formState.unit ?? ''} onChange={(e) => handleFormChange('unit', e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave}>Zapisz</Button>
          </DialogFooter>
        </>)}
      </DialogContent></Dialog>
    </Card>
  );
}
