import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User } from '../../App';

type SalesReport = {
  date: string;
  item: string;
  quantity: number;
  revenue: number;
};

type ExpenseReport = {
  date: string;
  vendor: string;
  amount: number;
  category: string;
};

type TimeReport = {
  employee: string;
  date: string;
  hoursWorked: number;
};

const MOCK_SALES: SalesReport[] = [
  { date: '2025-11-05', item: 'Cappuccino', quantity: 45, revenue: 540.0 },
  { date: '2025-11-05', item: 'Croissant', quantity: 30, revenue: 180.0 },
  { date: '2025-11-06', item: 'Espresso', quantity: 60, revenue: 480.0 },
];

const MOCK_EXPENSES: ExpenseReport[] = [
  { date: '2025-11-03', vendor: 'Dostawca Kawy XYZ', amount: 1200.0, category: 'Surowce' },
  { date: '2025-11-04', vendor: 'Piekarnia ABC', amount: 450.0, category: 'Wypieki' },
];

const MOCK_TIME: TimeReport[] = [
  { employee: 'Jan Nowak', date: '2025-11-06', hoursWorked: 8 },
  { employee: 'Maria Wiśniewska', date: '2025-11-06', hoursWorked: 6 },
];

type ReportsTabProps = {
  user: User;
};

export default function ReportsTab({ user }: ReportsTabProps) {
  const [dateFrom, setDateFrom] = useState('2025-11-01');
  const [dateTo, setDateTo] = useState('2025-11-06');

  const handleExport = (reportType: string) => {
    toast.success(`Eksportowanie raportu: ${reportType}`);
  };

  return (
    <div className="p-6">
      <h2 className="mb-6">Raporty</h2>

      <Card className="p-4 mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label>Data od</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label>Data do</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700">
            Generuj raporty
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sprzedaż</TabsTrigger>
          <TabsTrigger value="expenses">Wydatki</TabsTrigger>
          <TabsTrigger value="time">Czas pracy</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3>Raport sprzedaży</h3>
              <Button
                variant="outline"
                onClick={() => handleExport('Sprzedaż')}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Eksportuj CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Pozycja</TableHead>
                  <TableHead>Ilość</TableHead>
                  <TableHead>Przychód</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_SALES.map((sale, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{sale.date}</TableCell>
                    <TableCell>{sale.item}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.revenue.toFixed(2)} zł</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3}><strong>Suma</strong></TableCell>
                  <TableCell>
                    <strong>
                      {MOCK_SALES.reduce((sum, s) => sum + s.revenue, 0).toFixed(2)} zł
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3>Raport wydatków</h3>
              <Button
                variant="outline"
                onClick={() => handleExport('Wydatki')}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Eksportuj CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Dostawca</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Kwota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_EXPENSES.map((expense, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.vendor}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.amount.toFixed(2)} zł</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3}><strong>Suma</strong></TableCell>
                  <TableCell>
                    <strong>
                      {MOCK_EXPENSES.reduce((sum, e) => sum + e.amount, 0).toFixed(2)} zł
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <h3>Raport czasu pracy</h3>
              <Button
                variant="outline"
                onClick={() => handleExport('Czas pracy')}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Eksportuj CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pracownik</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Godziny</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_TIME.map((time, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{time.employee}</TableCell>
                    <TableCell>{time.date}</TableCell>
                    <TableCell>{time.hoursWorked}h</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2}><strong>Suma godzin</strong></TableCell>
                  <TableCell>
                    <strong>
                      {MOCK_TIME.reduce((sum, t) => sum + t.hoursWorked, 0)}h
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
