import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Activity } from 'lucide-react';
import { User } from '../../services/api';
import { logsAPI } from '../../services/api';

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

export default function LogsTab({ user }: LogsTabProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const logsData = await logsAPI.getAll(100, 0);
        setLogs(logsData);
      } catch (error) {
        console.error('Failed to load logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

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

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-6 h-6" />
        <h2>Logi systemowe</h2>
      </div>

      <Card className="p-6">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Brak logów w systemie</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getModuleBadge(log.module)}
                      <span className="font-medium">{log.action}</span>
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
