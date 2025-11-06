import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User } from '../../App';

type Shift = {
  id: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
};

const INITIAL_SHIFTS: Shift[] = [
  { id: '1', employeeName: 'Jan Nowak', date: '2025-11-06', startTime: '08:00', endTime: '16:00' },
  { id: '2', employeeName: 'Maria Wiśniewska', date: '2025-11-06', startTime: '16:00', endTime: '22:00' },
  { id: '3', employeeName: 'Piotr Zieliński', date: '2025-11-07', startTime: '08:00', endTime: '16:00' },
];

const EMPLOYEES = ['Jan Nowak', 'Maria Wiśniewska', 'Piotr Zieliński', 'Anna Kowalska'];

type ScheduleTabProps = {
  user: User;
};

export default function ScheduleTab({ user }: ScheduleTabProps) {
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: '',
    startTime: '',
    endTime: '',
  });

  const handleAddShift = () => {
    setFormData({ employeeName: '', startTime: '', endTime: '' });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.employeeName || !formData.startTime || !formData.endTime) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    const newShift: Shift = {
      id: Date.now().toString(),
      employeeName: formData.employeeName,
      date: selectedDate.toISOString().split('T')[0],
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    setShifts([...shifts, newShift]);
    toast.success('Zmiana dodana');
    setIsDialogOpen(false);
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter((shift) => shift.date === dateStr);
  };

  const selectedDateShifts = getShiftsForDate(selectedDate);

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  return (
    <div className="p-6">
      <h2 className="mb-6">Grafik pracy</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md"
          />
        </Card>

        {/* Shifts for selected date */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3>
              {selectedDate.toLocaleDateString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextDay}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={handleAddShift}
            className="w-full mb-4 bg-amber-600 hover:bg-amber-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj zmianę
          </Button>

          <div className="space-y-3">
            {selectedDateShifts.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                Brak zmian w tym dniu
              </Card>
            ) : (
              selectedDateShifts.map((shift) => (
                <Card key={shift.id} className="p-4">
                  <div>{shift.employeeName}</div>
                  <div className="text-gray-600">
                    {shift.startTime} - {shift.endTime}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
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
                value={selectedDate.toLocaleDateString('pl-PL')}
                disabled
              />
            </div>

            <div>
              <Label>Pracownik</Label>
              <Select
                value={formData.employeeName}
                onValueChange={(value) => setFormData({ ...formData, employeeName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz pracownika" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEES.map((emp) => (
                    <SelectItem key={emp} value={emp}>
                      {emp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Godzina rozpoczęcia</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            <div>
              <Label>Godzina zakończenia</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
