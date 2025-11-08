import React from 'react';
import { Shift, ScheduleCellProps } from './types';
import ShiftCard from './ShiftCard';

export default function ScheduleCell({
  date,
  shifts,
  onTimeSlotClick,
  onShiftEdit,
  isEditable
}: ScheduleCellProps) {
  const handleCellClick = (e: React.MouseEvent) => {
    // Only trigger if clicking on empty space, not on shift cards
    if (e.target === e.currentTarget && isEditable) {
      onTimeSlotClick(date, '');
    }
  };

  return (
    <div
      className="min-h-[60px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50"
      onClick={handleCellClick}
    >
      {shifts.map((shift) => (
        <ShiftCard
          key={shift.id}
          shift={shift}
          onEdit={onShiftEdit}
          isEditable={isEditable}
        />
      ))}
    </div>
  );
}