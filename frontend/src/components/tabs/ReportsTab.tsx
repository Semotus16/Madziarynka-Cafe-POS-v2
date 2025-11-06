import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../../services/api';
import { reportsAPI } from '../../services/api';

type ReportsTabProps = {
  user: User;
};

export default function ReportsTab({ user }: ReportsTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true);
        const data = await reportsAPI.getDaily(selectedDate);
        setReportData(data);
      } catch (error) {
        console.error('Failed to load report:', error);
        toast.error('Błąd podczas ładowania raportu');
      } finally {
        setIsLoading(false);
      }
    };
    loadReport();
  }, [selectedDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', { 
      style: 'currency', 
      currency: 'PLN' 
    }).format(value || 0);
  };

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Ładowanie raportu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="mb-6">Raporty</h2>

      <div className="mb-6">
        <Label>Data raportu</Label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
      </div>

      {reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Łączna sprzedaż</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.summary?.total_revenue || 0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Liczba zamówień</p>
                  <p className="text-2xl font-bold">{reportData.summary?.total_orders || 0}</p>
                </div>
                <BarChart className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Średnia wartość</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(reportData.summary?.average_order_value || 0)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Top Products */}
          {reportData.topProducts && reportData.topProducts.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top 5 produktów</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total_sold" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.topProducts}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                      >
                        {reportData.topProducts.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center text-gray-500">
          <p>Brak danych dla wybranej daty</p>
          <p className="text-sm mt-2">Wybierz inną datę lub utwórz zamówienia</p>
        </Card>
      )}
    </div>
  );
}
