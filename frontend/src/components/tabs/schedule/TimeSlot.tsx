import { TimeSlot as TimeSlotType } from './types';

interface TimeSlotProps {
  timeSlot: TimeSlotType;
  onClick: () => void;
  isOccupied: boolean;
  isEditable: boolean;
}

export default function TimeSlot({ timeSlot, onClick, isOccupied, isEditable }: TimeSlotProps) {
  return (
    <div
      className={`
        h-8 border-b border-gray-200 flex items-center justify-center text-xs cursor-pointer
        hover:bg-gray-50 transition-colors
        ${isOccupied ? 'bg-amber-100' : 'bg-white'}
        ${isEditable ? '' : 'cursor-not-allowed opacity-50'}
      `}
      onClick={isEditable ? onClick : undefined}
    >
      {timeSlot.displayTime}
    </div>
  );
}