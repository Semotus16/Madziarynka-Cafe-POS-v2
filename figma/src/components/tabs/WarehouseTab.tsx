import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User } from '../../App';

type WarehouseItem = {
  id: string;
  name: string;
  currentStock: number;
  nominalStock: number;
  unit: string;
  status: 'OK' | 'LOW' | 'CRITICAL';
};

const INITIAL_WAREHOUSE: WarehouseItem[] = [
  { id: '1', name: 'Kawa ziarnista', currentStock: 5000, nominalStock: 10000, unit: 'g', status: 'LOW' },
  { id: '2', name: 'Mleko', currentStock: 15, nominalStock: 20, unit: 'l', status: 'OK' },
  { id: '3', name: 'Croissant mrożony', currentStock: 20, nominalStock: 50, unit: 'szt', status: 'CRITICAL' },
  { id: '4', name: 'Cukier', currentStock: 2000, nominalStock: 3000, unit: 'g', status: 'OK' },
];

type WarehouseTabProps = {
  user: User;
};

export default function WarehouseTab({ user }: WarehouseTabProps) {
  const [items, setItems] = useState<WarehouseItem[]>(INITIAL_WAREHOUSE);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    currentStock: '',
    nominalStock: '',
    unit: '',
  });

  const calculateStatus = (current: number, nominal: number): 'OK' | 'LOW' | 'CRITICAL' => {
    const percentage = (current / nominal) * 100;
    if (percentage < 30) return 'CRITICAL';
    if (percentage < 50) return 'LOW';
    return 'OK';
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', currentStock: '', nominalStock: '', unit: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: WarehouseItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      currentStock: item.currentStock.toString(),
      nominalStock: item.nominalStock.toString(),
      unit: item.unit,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success('Pozycja usunięta');
  };

  const handleSave = () => {
    if (!formData.name || !formData.currentStock || !formData.nominalStock || !formData.unit) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    const current = parseFloat(formData.currentStock);
    const nominal = parseFloat(formData.nominalStock);

    if (editingItem) {
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: formData.name,
                currentStock: current,
                nominalStock: nominal,
                unit: formData.unit,
                status: calculateStatus(current, nominal),
              }
            : item
        )
      );
      toast.success('Pozycja zaktualizowana');
    } else {
      const newItem: WarehouseItem = {
        id: Date.now().toString(),
        name: formData.name,
        currentStock: current,
        nominalStock: nominal,
        unit: formData.unit,
        status: calculateStatus(current, nominal),
      };
      setItems([...items, newItem]);
      toast.success('Pozycja dodana');
    }

    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: WarehouseItem['status']) => {
    switch (status) {
      case 'OK':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'LOW':
        return <Badge className="bg-yellow-100 text-yellow-800">Niski</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800">Krytyczny</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2>Magazyn</h2>
        <Button onClick={handleAdd} className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4" />
          Dodaj surowiec
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nazwa</TableHead>
              <TableHead>Stan</TableHead>
              <TableHead>Stan nominalny</TableHead>
              <TableHead>Jednostka</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.currentStock}</TableCell>
                <TableCell>{item.nominalStock}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
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
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edytuj surowiec' : 'Dodaj surowiec'}
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
              <Label>Stan aktualny</Label>
              <Input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Stan nominalny</Label>
              <Input
                type="number"
                value={formData.nominalStock}
                onChange={(e) => setFormData({ ...formData, nominalStock: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Jednostka</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
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
