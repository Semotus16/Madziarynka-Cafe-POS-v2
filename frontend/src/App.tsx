import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import MainLayout from "./components/MainLayout";
import { Toaster } from "./components/ui/sonner";
import { authAPI } from "./services/api";
import { toast } from "sonner";

export type User = {
  id: string;
  name: string;
  role: "admin" | "employee";
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(
    null,
  );

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  // ZMIANA: Poprawiona i kompletna logika wylogowania.
  const handleLogout = async () => {
    try {
      await authAPI.logout();
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