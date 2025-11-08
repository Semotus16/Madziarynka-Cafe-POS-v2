import { useState, useEffect } from 'react';
import { WeeklyScheduleProps, Shift, DaySchedule, TimeSlot, EmployeeScheduleRow } from './types';
import WeekNavigation from './WeekNavigation';
import EmployeeScheduleTable from './EmployeeScheduleTable';
import ScheduleModal from './ScheduleModal';
import { shiftsAPI, usersAPI } from '../../../services/api';
import { toast } from 'sonner';

export default function WeeklySchedule({ user }: WeeklyScheduleProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [employeeRows, setEmployeeRows] = useState<EmployeeScheduleRow[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [editingShift, setEditingShift] = useState<Shift | undefined>();

  const timeSlots: TimeSlot[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push({
        time,
        displayTime: time,
      });
    }
  }

  const generateWeekSchedule = (weekStart: Date): DaySchedule[] => {
    const days: DaySchedule[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);

      const dayName = date.toLocaleDateString('pl-PL', { weekday: 'long' });
      const dateString = date.toISOString().split('T')[0];
      const isToday = date.getTime() === today.getTime();

      days.push({
        date: dateString,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        shifts: [],
        isToday,
      });
    }

    return days;
  };

  const checkForConflicts = (shifts: Shift[]) => {
    const conflicts: Set<number> = new Set();

    // Grupuj zmiany po użytkowniku
    const shiftsByUser: { [userId: number]: Shift[] } = {};
    shifts.forEach(shift => {
      if (!shiftsByUser[shift.user_id]) {
        shiftsByUser[shift.user_id] = [];
      }
      shiftsByUser[shift.user_id].push(shift);
    });

    // Sprawdź konflikty dla każdego użytkownika
    Object.values(shiftsByUser).forEach(userShifts => {
      for (let i = 0; i < userShifts.length; i++) {
        for (let j = i + 1; j < userShifts.length; j++) {
          const shift1 = userShifts[i];
          const shift2 = userShifts[j];

          const start1 = new Date(shift1.start_time).getTime();
          const end1 = new Date(shift1.end_time).getTime();
          const start2 = new Date(shift2.start_time).getTime();
          const end2 = new Date(shift2.end_time).getTime();

          // Sprawdź czy przedziały czasowe się nakładają
          if (start1 < end2 && end1 > start2) {
            conflicts.add(shift1.id);
            conflicts.add(shift2.id);
          }
        }
      }
    });

    return conflicts;
  };

  const transformToEmployeeRows = (daySchedules: DaySchedule[], users: { id: number; name: string }[]): EmployeeScheduleRow[] => {
    const employeeMap: { [userId: number]: { employee: { id: number; name: string }; schedule: { [date: string]: Shift[] } } } = {};

    // Inicjalizuj mapę dla wszystkich użytkowników
    users.forEach(user => {
      employeeMap[user.id] = {
        employee: user,
        schedule: {}
      };
    });

    // Wypełnij harmonogramy zmianami
    daySchedules.forEach(day => {
      day.shifts.forEach(shift => {
        if (employeeMap[shift.user_id]) {
          if (!employeeMap[shift.user_id].schedule[day.date]) {
            employeeMap[shift.user_id].schedule[day.date] = [];
          }
          employeeMap[shift.user_id].schedule[day.date].push(shift);
        }
      });
    });

    return Object.values(employeeMap);
  };

  const loadScheduleData = async (weekStart: Date) => {
    try {
      setIsLoading(true);

      // Load users
      const usersData = await usersAPI.getAll();
      setUsers(usersData);

      // Generate week structure
      const weekDays = generateWeekSchedule(weekStart);

      // Load shifts for each day of the week
      const shiftsPromises = weekDays.map(async (day) => {
        try {
          const shifts = await shiftsAPI.getAll(day.date);
          return { ...day, shifts };
        } catch (error) {
          console.error(`Failed to load shifts for ${day.date}:`, error);
          return day;
        }
      });

      const scheduleWithShifts = await Promise.all(shiftsPromises);

      // Dodaj informacje o konfliktach dla każdej zmiany
      const scheduleWithConflicts = scheduleWithShifts.map(day => {
        const allShiftsInWeek = scheduleWithShifts.flatMap(d => d.shifts);
        const conflicts = checkForConflicts(allShiftsInWeek);

        const shiftsWithConflicts = day.shifts.map((shift: Shift) => ({
          ...shift,
          hasConflict: conflicts.has(shift.id)
        }));

        return { ...day, shifts: shiftsWithConflicts };
      });

      setWeekSchedule(scheduleWithConflicts);

      // Transformuj dane na format tabelaryczny
      const rows = transformToEmployeeRows(scheduleWithConflicts, usersData);
      setEmployeeRows(rows);
    } catch (error) {
      console.error('Failed to load schedule data:', error);
      toast.error('Błąd podczas ładowania danych harmonogramu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set current week to start on Monday
    const monday = new Date(currentWeek);
    const dayOfWeek = monday.getDay();
    const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    loadScheduleData(monday);
  }, [currentWeek]);

  const handleTimeSlotClick = (date: string, time: string) => {
    if (user.role !== 'admin') return;

    setSelectedDate(date);
    setSelectedTime(time);
    setEditingShift(undefined);
    setIsModalOpen(true);
  };

  const handleShiftEdit = (shift: Shift) => {
    if (user.role !== 'admin') return;

    setSelectedDate(shift.start_time.split('T')[0]);
    setSelectedTime('');
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  const handleSaveShift = async (shiftData: Omit<Shift, 'id'>) => {
    try {
      // Sprawdź konflikty przed zapisaniem
      const conflictResult = await shiftsAPI.checkConflicts(
        shiftData.user_id,
        shiftData.start_time,
        shiftData.end_time,
        editingShift?.id
      );

      if (conflictResult.hasConflict) {
        throw new Error('Nie można zapisać zmiany - występuje konflikt czasowy z istniejącą zmianą');
      }

      if (editingShift) {
        // Update existing shift - for now, delete and create new
        // In a real implementation, you'd have an update API
        await shiftsAPI.create(shiftData, user);
        // TODO: Delete old shift if different
      } else {
        await shiftsAPI.create(shiftData, user);
      }

      // Reload data
      const monday = new Date(currentWeek);
      const dayOfWeek = monday.getDay();
      const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      await loadScheduleData(monday);
    } catch (error) {
      console.error('Failed to save shift:', error);
      throw error;
    }
  };

  const isEditable = user.role === 'admin';

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ładowanie harmonogramu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="mb-6">Harmonogram pracy</h2>

      <WeekNavigation
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
      />

      <div className="bg-white rounded-lg border overflow-hidden">
        <EmployeeScheduleTable
          rows={employeeRows}
          onTimeSlotClick={handleTimeSlotClick}
          onShiftEdit={handleShiftEdit}
          isEditable={isEditable}
          currentWeek={currentWeek}
        />
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        existingShift={editingShift}
        onSave={handleSaveShift}
        users={users}
      />
    </div>
  );
}