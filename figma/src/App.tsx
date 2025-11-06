import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import MainLayout from "./components/MainLayout";
import { Toaster } from "./components/ui/sonner";

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

  const handleLogout = () => {
    setCurrentUser(null);
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