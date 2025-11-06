import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../../services/api';
import { shiftsAPI, usersAPI } from '../../services/api';

type Shift = {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  user_name?: string;
};

type ScheduleTabProps = {
  user: User;
};

export default function ScheduleTab({ user }: ScheduleTabProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    user_id: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [shiftsData, usersData] = await Promise.all([
          shiftsAPI.getAll(selectedDate),
          usersAPI.getAll(),
        ]);
        setShifts(shiftsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Błąd podczas ładowania danych');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedDate]);

  const handleAddShift = () => {
    setFormData({ user_id: '', start_time: '', end_time: '' });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.user_id || !formData.start_time || !formData.end_time) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    try {
      const startDateTime = `${selectedDate}T${formData.start_time}:00`;
      const endDateTime = `${selectedDate}T${formData.end_time}:00`;
      
      await shiftsAPI.create({
        user_id: parseInt(formData.user_id),
        start_time: startDateTime,
        end_time: endDateTime,
      });

      // Reload shifts
      const shiftsData = await shiftsAPI.getAll(selectedDate);
      setShifts(shiftsData);
      
      toast.success('Zmiana dodana');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create shift:', error);
      toast.error('Błąd podczas dodawania zmiany');
    }
  };

  const formatTime = (dateTime: string) => {
    try {
      return new Date(dateTime).toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateTime;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ładowanie...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="mb-6">Grafik pracy</h2>

      <div className="mb-6">
        <Label>Wybierz datę</Label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
      </div>

      <Button
        onClick={handleAddShift}
        className="mb-6 bg-amber-600 hover:bg-amber-700 gap-2"
      >
        <Plus className="w-4 h-4" />
        Dodaj zmianę
      </Button>

      <div className="space-y-3">
        {shifts.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            Brak zmian w tym dniu
          </Card>
        ) : (
          shifts.map((shift) => (
            <Card key={shift.id} className="p-4">
              <div className="font-medium">{shift.user_name || `Pracownik #${shift.user_id}`}</div>
              <div className="text-gray-600">
                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj zmianę</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input
                value={new Date(selectedDate).toLocaleDateString('pl-PL')}
                disabled
              />
            </div>

            <div>
              <Label>Pracownik</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => setFormData({ ...formData, user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz pracownika" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Godzina rozpoczęcia</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>

            <div>
              <Label>Godzina zakończenia</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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
