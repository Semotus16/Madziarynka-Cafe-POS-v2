import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User } from '../../App';

type MenuItem = {
  id: string;
  name: string;
  price: number;
  group: string;
  bom: string; // Bill of Materials
};

const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Espresso', price: 8.0, group: 'Kawa', bom: 'Kawa ziarnista 7g, Woda 30ml' },
  { id: '2', name: 'Cappuccino', price: 12.0, group: 'Kawa', bom: 'Kawa ziarnista 7g, Mleko 150ml' },
  { id: '3', name: 'Croissant', price: 6.0, group: 'Wypieki', bom: 'Croissant mrożony 1szt' },
  { id: '4', name: 'Sernik', price: 15.0, group: 'Desery', bom: 'Sernik kawałek 120g' },
];

type MenuTabProps = {
  user: User;
};

export default function MenuTab({ user }: MenuTabProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    group: '',
    bom: '',
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', price: '', group: '', bom: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      group: item.group,
      bom: item.bom,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setMenuItems(menuItems.filter((item) => item.id !== id));
    toast.success('Pozycja usunięta');
  };

  const handleSave = () => {
    if (!formData.name || !formData.price || !formData.group) {
      toast.error('Wypełnij wszystkie wymagane pola');
      return;
    }

    if (editingItem) {
      setMenuItems(
        menuItems.map((item) =>
          item.id === editingItem.id
            ? { ...item, ...formData, price: parseFloat(formData.price) }
            : item
        )
      );
      toast.success('Pozycja zaktualizowana');
    } else {
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: formData.name,
        price: parseFloat(formData.price),
        group: formData.group,
        bom: formData.bom,
      };
      setMenuItems([...menuItems, newItem]);
      toast.success('Pozycja dodana');
    }

    setIsDialogOpen(false);
  };

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
              <TableHead>BOM</TableHead>
              <TableHead className="w-24">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.price.toFixed(2)} zł</TableCell>
                <TableCell>{item.group}</TableCell>
                <TableCell className="max-w-xs truncate">{item.bom}</TableCell>
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
              {editingItem ? 'Edytuj pozycję' : 'Dodaj pozycję'}
            </DialogTitle>
          </DialogHeader>

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
                onValueChange={(value) => setFormData({ ...formData, group: value })}
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

            <div>
              <Label>BOM (Bill of Materials)</Label>
              <Input
                value={formData.bom}
                onChange={(e) => setFormData({ ...formData, bom: e.target.value })}
                placeholder="np. Kawa ziarnista 7g, Woda 30ml"
              />
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
