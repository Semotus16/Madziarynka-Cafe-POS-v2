import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';
import { User, authAPI, usersAPI } from '../services/api';

const MOCK_USERS: User[] = [
  { id: 1, name: 'Admin', role: 'admin' },
  { id: 2, name: 'Pracownik1', role: 'employee' },
  { id: 3, name: 'Pracownik2', role: 'employee' },
  { id: 4, name: 'Pracownik3', role: 'employee' },
];

type LoginScreenProps = {
  onLogin: (user: User, token: string) => void;
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load users from API on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await usersAPI.getAll();
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Fallback to mock data if API fails
        setUsers(MOCK_USERS);
      }
    };
    loadUsers();
  }, []);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4 && !isLoading) {
      setPin(pin + num);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleLogin = async () => {
    if (!selectedUser || pin.length !== 4) {
      toast.error('Wybierz użytkownika i wprowadź 4-cyfrowy PIN');
      return;
    }
    try {
      const response = await authAPI.login(selectedUser.id, pin);
      onLogin(response.user, response.token); // Przekazujemy użytkownika I TOKEN
    } catch (error) {
      console.error("Błąd logowania:", error);
      toast.error("Nieprawidłowy PIN lub błąd serwera.");
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-4xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-amber-800 mb-2">Madziarynka Cafe</h1>
          <p className="text-gray-600">System zarządzania kawiarnią</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* User selection */}
          <div>
            <h2 className="mb-4 text-gray-700">Wybierz użytkownika</h2>
            <div className="grid grid-cols-2 gap-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedUser?.id === user.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <Avatar className="w-16 h-16 mx-auto mb-2">
                    <AvatarFallback className="bg-amber-200 text-amber-800">
                      {user.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div>{user.name}</div>
                    <div className="text-gray-500 text-sm">{user.role === 'admin' ? 'Administrator' : 'Pracownik'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PIN pad */}
          <div>
            <h2 className="mb-4 text-gray-700">Wprowadź PIN</h2>
            <div className="mb-6">
              <div className="bg-white border-2 border-gray-300 rounded-lg p-6 text-center">
                <div className="flex justify-center gap-3 mb-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center bg-gray-50"
                    >
                      <span className="text-2xl">{pin[i] ? '•' : ''}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 text-sm">
                  {selectedUser ? `PIN dla: ${selectedUser.name}` : 'Najpierw wybierz użytkownika'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <Button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={!selectedUser || isLoading}
                  variant="outline"
                  className="h-16 text-xl"
                >
                  {num}
                </Button>
              ))}
              <Button
                onClick={handleClear}
                disabled={!selectedUser || isLoading}
                variant="outline"
                className="h-16"
              >
                Wyczyść
              </Button>
              <Button
                onClick={() => handleNumberClick('0')}
                disabled={!selectedUser || isLoading}
                variant="outline"
                className="h-16 text-xl"
              >
                0
              </Button>
              <Button
                onClick={handleLogin}
                disabled={!selectedUser || pin.length !== 4 || isLoading}
                className="h-16 bg-amber-600 hover:bg-amber-700"
              >
                {isLoading ? 'Logowanie...' : 'Zaloguj'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
