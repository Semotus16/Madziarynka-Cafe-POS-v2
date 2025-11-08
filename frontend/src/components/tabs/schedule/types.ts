export interface Shift {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  user_name?: string;
  hasConflict?: boolean;
}

export interface TimeSlot {
  time: string; // Format: "HH:MM"
  displayTime: string; // Format: "HH:MM"
}

export interface DaySchedule {
  date: string; // Format: "YYYY-MM-DD"
  dayName: string; // e.g., "Poniedziałek"
  shifts: Shift[];
  isToday: boolean;
}

export interface WeekSchedule {
  weekStart: Date;
  weekEnd: Date;
  days: DaySchedule[];
}

export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime?: string;
  existingShift?: Shift;
  onSave: (shift: Omit<Shift, 'id'>) => Promise<void>;
  users: { id: number; name: string }[];
}

export interface ShiftCardProps {
  shift: Shift;
  onEdit?: (shift: Shift) => void;
  isEditable?: boolean;
}

export interface DayColumnProps {
  day: DaySchedule;
  timeSlots: TimeSlot[];
  onTimeSlotClick: (date: string, time: string) => void;
  onShiftEdit: (shift: Shift) => void;
  isEditable: boolean;
}

export interface WeekNavigationProps {
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
}

export interface WeeklyScheduleProps {
  user: { id: number; name: string; role: "admin" | "employee" };
}

export interface EmployeeScheduleRow {
  employee: { id: number; name: string };
  schedule: { [date: string]: Shift[] };
}

export interface ScheduleCellProps {
  date: string;
  shifts: Shift[];
  onTimeSlotClick: (date: string, time: string) => void;
  onShiftEdit: (shift: Shift) => void;
  isEditable: boolean;
}

export interface EmployeeRowProps {
  employee: { id: number; name: string };
  schedule: { [date: string]: Shift[] };
  onTimeSlotClick: (date: string, time: string) => void;
  onShiftEdit: (shift: Shift) => void;
  isEditable: boolean;
  currentWeek: Date;
}

export interface EmployeeScheduleTableProps {
  rows: EmployeeScheduleRow[];
  onTimeSlotClick: (date: string, time: string) => void;
  onShiftEdit: (shift: Shift) => void;
  isEditable: boolean;
  currentWeek: Date;
}