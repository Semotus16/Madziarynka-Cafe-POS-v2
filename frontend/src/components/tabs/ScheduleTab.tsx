import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User } from '../../App';

type Employee = {
  id: string;
  name: string;
  color: string;
  position: string;
};

type Shift = {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
};

const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Adam', color: 'bg-orange-200', position: 'Sprzedawca' },
  { id: '2', name: 'Darek', color: 'bg-orange-300', position: 'Sprzedawca' },
  { id: '3', name: 'Ewelina', color: 'bg-green-200', position: 'Sprzedawca' },
  { id: '4', name: 'Maria', color: 'bg-gray-100', position: 'Sprzedawca' },
  { id: '5', name: 'Marian', color: 'bg-orange-400', position: 'Sprzedawca' },
  { id: '6', name: 'Zosia', color: 'bg-blue-200', position: 'Sprzedawca' },
];

const INITIAL_SHIFTS: Shift[] = [
  { id: '1', employeeId: '1', date: '2025-11-10', startTime: '13:00', endTime: '21:00' },
  { id: '2', employeeId: '2', date: '2025-11-10', startTime: '09:00', endTime: '17:00' },
  { id: '3', employeeId: '2', date: '2025-11-11', startTime: '09:00', endTime: '17:00' },
  { id: '4', employeeId: '3', date: '2025-11-10', startTime: '13:00', endTime: '21:00' },
  { id: '5', employeeId: '4', date: '2025-11-10', startTime: '07:00', endTime: '15:00' },
  { id: '6', employeeId: '5', date: '2025-11-10', startTime: '09:00', endTime: '17:00' },
  { id: '7', employeeId: '6', date: '2025-11-11', startTime: '07:00', endTime: '15:00' },
];

type ScheduleTabProps = {
  user: User;
};

export default function ScheduleTab({ user }: ScheduleTabProps) {
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const today = new Date(2025, 10, 10); // 10 Nov 2025 (Monday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: string } | null>(null);
  const [selectedNoteDate, setSelectedNoteDate] = useState<string>('');
  const [noteText, setNoteText] = useState('');
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const goToPreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStartDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStartDate(newDate);
  };

  const getShiftForEmployeeAndDate = (employeeId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.find((shift) => shift.employeeId === employeeId && shift.date === dateStr);
  };

  const calculateHours = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const hours = endH - startH + (endM - startM) / 60;
    return Math.round(hours);
  };

  const handleCellClick = (employeeId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existingShift = getShiftForEmployeeAndDate(employeeId, date);

    if (existingShift) {
      setEditingShift(existingShift);
      setFormData({
        employeeId: existingShift.employeeId,
        date: existingShift.date,
        startTime: existingShift.startTime,
        endTime: existingShift.endTime,
      });
    } else {
      setEditingShift(null);
      setFormData({
        employeeId,
        date: dateStr,
        startTime: '09:00',
        endTime: '17:00',
      });
    }

    setSelectedCell({ employeeId, date: dateStr });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.employeeId || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    if (editingShift) {
      setShifts(
        shifts.map((shift) =>
          shift.id === editingShift.id
            ? { ...shift, startTime: formData.startTime, endTime: formData.endTime }
            : shift
        )
      );
      toast.success('Zmiana zaktualizowana');
    } else {
      const newShift: Shift = {
        id: Date.now().toString(),
        employeeId: formData.employeeId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };
      setShifts([...shifts, newShift]);
      toast.success('Zmiana dodana');
    }

    setIsDialogOpen(false);
    setEditingShift(null);
  };

  const handleDelete = () => {
    if (editingShift) {
      setShifts(shifts.filter((shift) => shift.id !== editingShift.id));
      toast.success('Zmiana usunięta');
      setIsDialogOpen(false);
      setEditingShift(null);
    }
  };

  const getDayName = (date: Date) => {
    const days = ['Niedz.', 'Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.'];
    return days[date.getDay()];
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}`;
  };

  const handleNoteClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedNoteDate(dateStr);
    setNoteText(notes[dateStr] || '');
    setIsNoteDialogOpen(true);
  };

  const handleNoteSave = () => {
    if (noteText.trim()) {
      setNotes({ ...notes, [selectedNoteDate]: noteText });
      toast.success('Uwaga zapisana');
    } else {
      const newNotes = { ...notes };
      delete newNotes[selectedNoteDate];
      setNotes(newNotes);
      toast.success('Uwaga usunięta');
    }
    setIsNoteDialogOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2>Grafik pracy</h2>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span>
            {weekDays[0].toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })} -{' '}
            {weekDays[6].toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 bg-gray-50 border"></TableHead>
              {weekDays.map((day, idx) => (
                <TableHead key={idx} className="text-center bg-gray-50 border w-28 p-1 min-w-28 max-w-28">
                  <div>{getDayName(day)}</div>
                  <div className="text-sm">{formatDate(day)}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {EMPLOYEES.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className={`${employee.color} border w-32 min-w-32 max-w-32 p-1`}>
                  <div className="py-1">
                    <div>{employee.name}</div>
                  </div>
                </TableCell>
                {weekDays.map((day, idx) => {
                  const shift = getShiftForEmployeeAndDate(employee.id, day);
                  return (
                    <TableCell
                      key={idx}
                      className="cursor-pointer hover:bg-gray-50 transition-colors text-center align-top border w-28 min-w-28 max-w-28 p-1 overflow-hidden"
                      onClick={() => handleCellClick(employee.id, day)}
                    >
                      {shift && (
                        <div className="py-1 overflow-hidden">
                          <div className="text-xs">
                            {shift.startTime} - {shift.endTime}
                          </div>
                          <div className="text-xs">
                            ({calculateHours(shift.startTime, shift.endTime)}h)
                          </div>
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="bg-yellow-100 border w-32 min-w-32 max-w-32 p-1">
                <div className="py-1">
                  <div>Uwagi</div>
                </div>
              </TableCell>
              {weekDays.map((day, idx) => {
                const dateStr = day.toISOString().split('T')[0];
                const note = notes[dateStr];
                return (
                  <TableCell
                    key={idx}
                    className="cursor-pointer hover:bg-gray-50 transition-colors text-center align-top border w-28 min-w-28 max-w-28 p-1 bg-yellow-50 overflow-hidden"
                    onClick={() => handleNoteClick(day)}
                  >
                    {note && (
                      <div className="py-1 overflow-hidden">
                        <div className="text-xs break-words whitespace-normal">{note}</div>
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? 'Edytuj zmianę' : 'Dodaj zmianę'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Pracownik</Label>
              <Input
                value={EMPLOYEES.find((e) => e.id === formData.employeeId)?.name || ''}
                disabled
              />
            </div>

            <div>
              <Label>Data</Label>
              <Input
                value={new Date(formData.date).toLocaleDateString('pl-PL')}
                disabled
              />
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
            {editingShift && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Uwagi do dnia</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input
                value={selectedNoteDate ? new Date(selectedNoteDate).toLocaleDateString('pl-PL') : ''}
                disabled
              />
            </div>

            <div>
              <Label>Uwaga</Label>
              <Input
                placeholder="np. Święto, wydarzenie specjalne..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleNoteSave} className="bg-amber-600 hover:bg-amber-700">
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
