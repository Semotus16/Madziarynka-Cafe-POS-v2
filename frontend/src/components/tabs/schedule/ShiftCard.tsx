import { ShiftCardProps } from './types';
import { Edit } from 'lucide-react';

export default function ShiftCard({ shift, onEdit, isEditable }: ShiftCardProps) {
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

  return (
    <div className={`text-white p-2 rounded-md text-xs relative group ${shift.hasConflict ? 'bg-red-600 border-2 border-red-400' : 'bg-amber-600'}`}>
      <div className="font-medium truncate">{shift.user_name || `Pracownik #${shift.user_id}`}</div>
      <div className={shift.hasConflict ? 'text-red-100' : 'text-amber-100'}>
        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
      </div>
      {shift.hasConflict && (
        <div className="text-red-200 text-xs mt-1 font-medium">
          ⚠ Konflikt
        </div>
      )}
      {isEditable && onEdit && (
        <button
          onClick={() => onEdit(shift)}
          className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 ${shift.hasConflict ? 'bg-red-700 hover:bg-red-800' : 'bg-amber-700 hover:bg-amber-800'}`}
        >
          <Edit className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}