import { WeekNavigationProps } from './types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';

export default function WeekNavigation({ currentWeek, onWeekChange }: WeekNavigationProps) {
  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

    const startMonth = startOfWeek.toLocaleDateString('pl-PL', { month: 'long' });
    const endMonth = endOfWeek.toLocaleDateString('pl-PL', { month: 'long' });
    const year = startOfWeek.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    } else {
      return `${startMonth} - ${endMonth} ${year}`;
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() - 7);
    onWeekChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + 7);
    onWeekChange(newDate);
  };

  const goToCurrentWeek = () => {
    onWeekChange(new Date());
  };

  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousWeek}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Poprzedni tydzień
      </Button>

      <div className="text-center">
        <h3 className="text-lg font-medium">{formatWeekRange(currentWeek)}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToCurrentWeek}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Aktualny tydzień
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={goToNextWeek}
        className="flex items-center gap-2"
      >
        Następny tydzień
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}