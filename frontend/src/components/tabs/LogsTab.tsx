import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { User } from '../../App';

type LogEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
};

const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: '2025-11-06 14:30:25',
    user: 'Anna Kowalska',
    action: 'Dodano',
    module: 'Menu',
    details: 'Dodano nową pozycję: Latte Macchiato',
  },
  {
    id: '2',
    timestamp: '2025-11-06 12:15:10',
    user: 'Jan Nowak',
    action: 'Aktualizacja',
    module: 'Magazyn',
    details: 'Zaktualizowano stan: Kawa ziarnista (5000g)',
  },
  {
    id: '3',
    timestamp: '2025-11-06 10:05:45',
    user: 'Maria Wiśniewska',
    action: 'Usunięto',
    module: 'Grafik',
    details: 'Usunięto zmianę z dnia 2025-11-10',
  },
  {
    id: '4',
    timestamp: '2025-11-05 18:22:30',
    user: 'Anna Kowalska',
    action: 'Dodano',
    module: 'Menu',
    details: 'Dodano nową pozycję: Croissant migdałowy',
  },
  {
    id: '5',
    timestamp: '2025-11-05 16:40:15',
    user: 'Piotr Zieliński',
    action: 'Aktualizacja',
    module: 'Zamówienia',
    details: 'Zrealizowano zamówienie #1234',
  },
];

type LogsTabProps = {
  user: User;
};

export default function LogsTab({ user }: LogsTabProps) {
  const [logs] = useState<LogEntry[]>(MOCK_LOGS);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesUser = filterUser === 'all' || log.user === filterUser;
    const matchesModule = filterModule === 'all' || log.module === filterModule;
    const matchesSearch =
      searchQuery === '' ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesUser && matchesModule && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Dodano':
        return <Badge className="bg-green-100 text-green-800">Dodano</Badge>;
      case 'Aktualizacja':
        return <Badge className="bg-blue-100 text-blue-800">Aktualizacja</Badge>;
      case 'Usunięto':
        return <Badge className="bg-red-100 text-red-800">Usunięto</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const uniqueUsers = Array.from(new Set(logs.map((log) => log.user)));
  const uniqueModules = Array.from(new Set(logs.map((log) => log.module)));

  return (
    <div className="p-6">
      <h2 className="mb-6">Logi systemowe</h2>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Szukaj</Label>
            <Input
              placeholder="Szukaj w szczegółach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Label>Użytkownik</Label>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Moduł</Label>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                {uniqueModules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data i czas</TableHead>
              <TableHead>Użytkownik</TableHead>
              <TableHead>Akcja</TableHead>
              <TableHead>Moduł</TableHead>
              <TableHead>Szczegóły</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.timestamp}</TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell>{log.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Brak logów spełniających kryteria wyszukiwania
        </div>
      )}
    </div>
  );
}
