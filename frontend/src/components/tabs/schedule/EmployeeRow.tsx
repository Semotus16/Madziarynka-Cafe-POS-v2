import React from 'react';
import { EmployeeRowProps } from './types';
import ScheduleCell from './ScheduleCell';
import { TableCell, TableRow } from '../../ui/table';

export default function EmployeeRow({
  employee,
  schedule,
  onTimeSlotClick,
  onShiftEdit,
  isEditable,
  currentWeek
}: EmployeeRowProps) {
  const weekDays = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  return (
    <TableRow>
      <TableCell className="font-medium">
        {employee.name}
      </TableCell>
      {weekDays.map((dayName, index) => {
        const monday = new Date(currentWeek);
        const dayOfWeek = monday.getDay();
        const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + index;
        monday.setDate(diff);
        const dateString = monday.toISOString().split('T')[0];

        const dayShifts = schedule[dateString] || [];

        return (
          <TableCell key={dayName} className="p-0">
            <ScheduleCell
              date={dateString}
              shifts={dayShifts}
              onTimeSlotClick={onTimeSlotClick}
              onShiftEdit={onShiftEdit}
              isEditable={isEditable}
            />
          </TableCell>
        );
      })}
    </TableRow>
  );
}