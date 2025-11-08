import { DayColumnProps } from './types';
import TimeSlot from './TimeSlot';
import ShiftCard from './ShiftCard';

export default function DayColumn({
  day,
  timeSlots,
  onTimeSlotClick,
  onShiftEdit,
  isEditable
}: DayColumnProps) {
  const getShiftsForTimeSlot = (time: string) => {
    return day.shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      const slotTime = new Date(`${day.date}T${time}:00`);

      return slotTime >= shiftStart && slotTime < shiftEnd;
    });
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Header */}
      <div className={`
        p-3 text-center font-medium border-b-2
        ${day.isToday ? 'bg-amber-100 border-amber-600 text-amber-800' : 'bg-gray-50 border-gray-300'}
      `}>
        <div className="text-sm">{day.dayName}</div>
        <div className="text-xs text-gray-600">{new Date(day.date).getDate()}</div>
      </div>

      {/* Time slots */}
      <div className="relative">
        {timeSlots.map((timeSlot, index) => {
          const shifts = getShiftsForTimeSlot(timeSlot.time);
          const isOccupied = shifts.length > 0;

          return (
            <div key={timeSlot.time} className="relative">
              <TimeSlot
                timeSlot={timeSlot}
                onClick={() => onTimeSlotClick(day.date, timeSlot.time)}
                isOccupied={isOccupied}
                isEditable={isEditable}
              />

              {/* Render shifts that start at this time slot */}
              {shifts.map((shift, shiftIndex) => {
                const startTime = new Date(shift.start_time);
                const endTime = new Date(shift.end_time);
                const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
                const height = (duration / 30) * 32; // 32px per 30min slot

                return (
                  <div
                    key={shift.id}
                    className="absolute left-0 right-0 z-10"
                    style={{
                      top: `${index * 32}px`,
                      height: `${height}px`,
                      marginTop: '2px'
                    }}
                  >
                    <ShiftCard
                      shift={shift}
                      onEdit={onShiftEdit}
                      isEditable={isEditable}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}