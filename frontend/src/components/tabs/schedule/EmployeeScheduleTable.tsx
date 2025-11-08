import React from 'react';
import { EmployeeScheduleTableProps } from './types';
import EmployeeRow from './EmployeeRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../../ui/table';

export default function EmployeeScheduleTable({
  rows,
  onTimeSlotClick,
  onShiftEdit,
  isEditable,
  currentWeek
}: EmployeeScheduleTableProps) {
  const weekDays = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-48">Pracownik</TableHead>
          {weekDays.map((dayName) => (
            <TableHead key={dayName} className="text-center">
              {dayName}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <EmployeeRow
            key={row.employee.id}
            employee={row.employee}
            schedule={row.schedule}
            onTimeSlotClick={onTimeSlotClick}
            onShiftEdit={onShiftEdit}
            isEditable={isEditable}
            currentWeek={currentWeek}
          />
        ))}
      </TableBody>
    </Table>
  );
}