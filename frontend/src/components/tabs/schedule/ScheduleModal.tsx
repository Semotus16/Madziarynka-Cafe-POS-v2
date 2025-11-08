import { useState, useEffect } from 'react';
import { ScheduleModalProps } from './types';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Alert, AlertDescription } from '../../ui/alert';
import { toast } from 'sonner';
import { shiftsAPI } from '../../../services/api';
import { AlertTriangle } from 'lucide-react';

export default function ScheduleModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  existingShift,
  onSave,
  users
}: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    user_id: '',
    start_time: selectedTime || '08:00',
    end_time: selectedTime ? getEndTime(selectedTime) : '16:00',
  });
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  useEffect(() => {
    if (existingShift) {
      const startTime = new Date(existingShift.start_time).toTimeString().slice(0, 5);
      const endTime = new Date(existingShift.end_time).toTimeString().slice(0, 5);
      setFormData({
        user_id: existingShift.user_id.toString(),
        start_time: startTime,
        end_time: endTime,
      });
    } else {
      setFormData({
        user_id: '',
        start_time: selectedTime || '08:00',
        end_time: selectedTime ? getEndTime(selectedTime) : '16:00',
      });
    }
    setConflictWarning(null);
  }, [existingShift, selectedTime, isOpen]);

  function getEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 8; // Default 8-hour shift
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const checkForConflicts = async () => {
    if (!formData.user_id || !formData.start_time || !formData.end_time) {
      return;
    }

    if (formData.start_time >= formData.end_time) {
      return;
    }

    setIsCheckingConflict(true);
    try {
      const startDateTime = `${selectedDate}T${formData.start_time}:00`;
      const endDateTime = `${selectedDate}T${formData.end_time}:00`;

      const conflictResult = await shiftsAPI.checkConflicts(
        parseInt(formData.user_id),
        startDateTime,
        endDateTime,
        existingShift?.id
      );

      if (conflictResult.hasConflict) {
        const conflictingShift = conflictResult.conflictingShift;
        const startTime = new Date(conflictingShift.start_time).toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const endTime = new Date(conflictingShift.end_time).toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit'
        });
        setConflictWarning(`Konflikt z istniejącą zmianą: ${startTime} - ${endTime}`);
      } else {
        setConflictWarning(null);
      }
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      setConflictWarning(null);
    } finally {
      setIsCheckingConflict(false);
    }
  };

  const handleSave = async () => {
    if (!formData.user_id || !formData.start_time || !formData.end_time) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error('Godzina zakończenia musi być późniejsza niż rozpoczęcia');
      return;
    }

    // Sprawdź konflikty przed zapisaniem
    try {
      const startDateTime = `${selectedDate}T${formData.start_time}:00`;
      const endDateTime = `${selectedDate}T${formData.end_time}:00`;

      const conflictResult = await shiftsAPI.checkConflicts(
        parseInt(formData.user_id),
        startDateTime,
        endDateTime,
        existingShift?.id
      );

      if (conflictResult.hasConflict) {
        toast.error('Nie można zapisać zmiany - występuje konflikt czasowy z istniejącą zmianą');
        return;
      }

      await onSave({
        user_id: parseInt(formData.user_id),
        start_time: startDateTime,
        end_time: endDateTime,
      });

      toast.success(existingShift ? 'Zmiana zaktualizowana' : 'Zmiana dodana');
      onClose();
    } catch (error) {
      console.error('Failed to save shift:', error);
      toast.error('Błąd podczas zapisywania zmiany');
    }
  };

  const timeOptions = generateTimeOptions();

  // Sprawdź konflikty przy zmianie danych formularza
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkForConflicts();
    }, 500); // Debounce na 500ms

    return () => clearTimeout(timeoutId);
  }, [formData.user_id, formData.start_time, formData.end_time, selectedDate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingShift ? 'Edytuj zmianę' : 'Dodaj zmianę'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {conflictWarning && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {conflictWarning}
              </AlertDescription>
            </Alert>
          )}
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
              onValueChange={(value: string) => setFormData({ ...formData, user_id: value })}
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
            <Select
              value={formData.start_time}
              onValueChange={(value: string) => setFormData({ ...formData, start_time: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Godzina zakończenia</Label>
            <Select
              value={formData.end_time}
              onValueChange={(value: string) => setFormData({ ...formData, end_time: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
            {existingShift ? 'Aktualizuj' : 'Dodaj'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}