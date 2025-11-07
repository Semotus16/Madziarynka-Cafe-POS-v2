import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Activity } from 'lucide-react';
import { User } from '../../services/api';
import { logsAPI, usersAPI } from '../../services/api';

type Log = {
  id: number;
  user_id: number;
  action: string;
  module: string;
  details: string;
  created_at: string;
  user_name?: string;
};

type LogsTabProps = {
  user: User;
};

// Filter types
type FilterState = {
  dateFrom: string;
  dateTo: string;
  userId: string;
  action: string;
  module: string;
};

type UserOption = {
  id: number;
  name: string;
  username: string;
};

type LogFilter = {
  name: string;
  actions: string[];
};

// Area types for display
const AREA_TYPES = [
  { value: '', label: 'Wszystkie obszary' },
  { value: 'Magazyn', label: 'Magazyn' },
  { value: 'Menu', label: 'Menu' },
  { value: 'Zamówienia', label: 'Zamówienia' },
  { value: 'Autoryzacja', label: 'Autoryzacja' },
  { value: 'Zmiana', label: 'Zmiana' }
];

export default function LogsTab({ user }: LogsTabProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [validationMessage, setValidationMessage] = useState<string>('');
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    userId: '',
    action: '',
    module: '',
  });
  
  // Filter data from API
  const [filterData, setFilterData] = useState<LogFilter[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  
  // Note: filteredLogs state is no longer needed since filtering is done on backend
  // const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);

  // Function to load logs with current filters
  const loadLogs = async () => {
    try {
      setIsLoading(true);
      // Prepare filter object, excluding empty values
      const filterParams: any = {};
      if (filters.userId && filters.userId !== 'all') filterParams.user_id = filters.userId;
      if (filters.action && filters.action !== 'all') filterParams.action = filters.action;
      if (filters.module && filters.module !== 'all') filterParams.module = filters.module;
      if (filters.dateFrom) filterParams.date_from = filters.dateFrom;
      if (filters.dateTo) filterParams.date_to = filters.dateTo;
      
      const logsData = await logsAPI.getAll(100, 0, filterParams);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const usersData = await usersAPI.getAll();
        // Transform users data to match our interface
        const transformedUsers = usersData.map(user => ({
          id: user.id,
          name: user.name || `${user.name}`,
          username: user.name || 'unknown'
        }));
        setUsers(transformedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const loadFilterData = async () => {
      try {
        setIsLoadingFilters(true);
        const filtersData = await logsAPI.getFilters();
        setFilterData(filtersData.modules);
        // Initialize with all actions when no area is selected
        const allActions = filtersData.modules.reduce((acc, module) => {
          return acc.concat(module.actions);
        }, [] as string[]);
        setAvailableActions(allActions);
      } catch (error) {
        console.error('Failed to load filter data:', error);
        // Fallback to default actions if API fails
        setAvailableActions([
          'LOGOWANIE_UŻYTKOWNIKA',
          'UTWORZENIE_ZAMÓWIENIA',
          'AKTUALIZACJA_ZAMÓWIENIA',
          'ZAKOŃCZENIE_ZAMÓWIENIA',
          'UTWORZENIE_SKŁADNIKA',
          'AKTUALIZACJA_SKŁADNIKA',
          'DEZAKTYWACJA_SKŁADNIKA',
          'UTWORZENIE_PRODUKTU',
          'AKTUALIZACJA_PRODUKTU',
          'DEZAKTYWACJA_PRODUKTU',
          'UTWORZENIE_ZMIANY',
          'NIEZNANY'
        ]);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadUsers();
    loadFilterData();
  }, []);

  // Load logs whenever filters change
  useEffect(() => {
    loadLogs();
  }, [filters]);

// Note: Local filtering logic removed - now handled by backend API
// The applyFilters function is no longer needed

  // Handle area change and update available actions
  const handleAreaChange = (areaValue: string) => {
    let newAvailableActions: string[] = [];
    let validationMsg = '';
    
    if (areaValue === '' || areaValue === 'all') {
      // If no area selected, show all actions
      const allActions = filterData.reduce((acc, module) => {
        return acc.concat(module.actions);
      }, [] as string[]);
      newAvailableActions = allActions;
    } else {
      // Find the selected area and its actions
      const selectedModule = filterData.find(module => 
        module.name.toLowerCase() === areaValue.toLowerCase()
      );
      
      if (selectedModule) {
        newAvailableActions = selectedModule.actions;
      } else {
        // Fallback to area-specific actions if not found in API data
        newAvailableActions = getAreaSpecificActions(areaValue);
      }
    }
    
    setAvailableActions(newAvailableActions);
    
    // Check if current action is valid for the new area
    if (filters.action && filters.action !== 'all' && !newAvailableActions.includes(filters.action)) {
      setFilters(prev => ({ ...prev, action: '' }));
      validationMsg = `Akcja "${filters.action}" nie jest dostępna w obszarze "${getAreaLabel(areaValue)}". Wybierz inną akcję lub zmień obszar.`;
    }
    
    setValidationMessage(validationMsg);
    
    // Update the area filter
    setFilters(prev => ({ ...prev, module: areaValue }));
  };

  // Get area-specific actions as fallback
  const getAreaSpecificActions = (area: string): string[] => {
    const areaActions: Record<string, string[]> = {
      'Autoryzacja': ['LOGOWANIE_UŻYTKOWNIKA'],
      'Zamówienia': ['UTWORZENIE_ZAMÓWIENIA', 'AKTUALIZACJA_ZAMÓWIENIA', 'ZAKOŃCZENIE_ZAMÓWIENIA'],
      'Menu': ['UTWORZENIE_PRODUKTU', 'AKTUALIZACJA_PRODUKTU', 'DEZAKTYWACJA_PRODUKTU'],
      'Magazyn': ['UTWORZENIE_SKŁADNIKA', 'AKTUALIZACJA_SKŁADNIKA', 'DEZAKTYWACJA_SKŁADNIKA'],
      'Zmiana': ['UTWORZENIE_ZMIANY']
    };
    
    return areaActions[area] || [];
  };

  // Get area label for display
  const getAreaLabel = (value: string): string => {
    if (!value) return 'Wszystkie obszary';
    const area = AREA_TYPES.find(a => a.value === value);
    return area?.label || value;
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    
    // Clear validation message when changing filters
    if (validationMessage) {
      setValidationMessage('');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      userId: '',
      action: '',
      module: '',
    });
    setValidationMessage('');
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('pl-PL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const getModuleBadge = (module: string) => {
    const colors = {
      auth: 'bg-blue-100 text-blue-800',
      orders: 'bg-green-100 text-green-800',
      products: 'bg-purple-100 text-purple-800',
      inventory: 'bg-orange-100 text-orange-800',
      schedule: 'bg-indigo-100 text-indigo-800',
      default: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[module as keyof typeof colors] || colors.default}>
        {module}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ładowanie logów...</div>
        </div>
      </div>
    );
  }

  if (isLoadingUsers || isLoadingFilters) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ładowanie danych...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-6 h-6" />
        <h2>Logi systemowe</h2>
        <span className="text-sm text-gray-500 ml-auto">
          {logs.length} logów
        </span>
      </div>

      {/* Filter Form */}
      <Card className="p-4 mb-6">
        <h3 className="text-lg font-medium mb-4">Filtry</h3>
        
        {/* Validation Message */}
        {validationMessage && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              {validationMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium mb-1">Data od</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="Wybierz datę od"
            />
          </div>
          
          {/* Date To */}
          <div>
            <label className="block text-sm font-medium mb-1">Data do</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              placeholder="Wybierz datę do"
            />
          </div>
          
          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Użytkownik</label>
            <Select
              value={filters.userId}
              onValueChange={(value: string) => handleFilterChange('userId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz użytkownika" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy użytkownicy</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Area Filter - MOVED BEFORE ACTION FILTER */}
          <div>
            <label className="block text-sm font-medium mb-1">Obszar</label>
            <Select
              value={filters.module}
              onValueChange={(value: string) => handleAreaChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz obszar" />
              </SelectTrigger>
              <SelectContent>
                {AREA_TYPES.map((area) => (
                  <SelectItem key={area.value} value={area.value || 'all'}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Action Filter - NOW SECOND TO LAST */}
          <div>
            <label className="block text-sm font-medium mb-1">Akcja</label>
            <Select
              value={filters.action}
              onValueChange={(value: string) => handleFilterChange('action', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz akcję" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie akcje</SelectItem>
                {availableActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Clear Filters Button */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full md:w-auto"
        >
          Wyczyść filtry
        </Button>
      </Card>

      {/* Logs Display */}
      <Card className="p-6">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Brak logów spełniających kryteria filtrowania</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-3">
              {logs.map((log: Log) => (
                <Card key={log.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getModuleBadge(log.module)}
                      <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(log.created_at)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>Użytkownik:</strong> {log.user_name || `ID: ${log.user_id}`}
                  </div>
                  
                  {log.details && (
                    <div className="text-sm text-gray-600">
                      <strong>Szczegóły:</strong> {log.details}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
