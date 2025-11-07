import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import MainLayout from "./components/MainLayout";
import { Toaster } from "./components/ui/sonner";
import { authAPI, User } from "./services/api";
import { toast } from "sonner";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(
    null,
  );

  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    
    // Store the token in localStorage for authenticated requests
    if (token) {
      localStorage.setItem('authToken', token);
    }
  };

  // ZMIANA: Poprawiona i kompletna logika wylogowania.
  const handleLogout = async () => {
    if (!currentUser) return;
    
    try {
      await authAPI.logout(currentUser);
      toast.success("Wylogowano pomyślnie!");
    } catch (error) {
      console.error("Logout failed, clearing session anyway.", error);
    } finally {
      setCurrentUser(null);
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <MainLayout user={currentUser} onLogout={handleLogout} />
      <Toaster />
    </>
  );
}