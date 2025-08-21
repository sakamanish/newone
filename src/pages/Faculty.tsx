import { useState } from "react";
import { FacultyLogin } from "@/components/FacultyLogin";
import { FacultyDashboard } from "@/components/FacultyDashboard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Faculty = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return <FacultyDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">LeetCode Tracker</h1>
          <Link to="/">
            <Button variant="outline">Student Registration</Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Faculty Portal</h2>
            <p className="text-muted-foreground">Login to view student progress</p>
          </div>
          <FacultyLogin onLoginSuccess={handleLoginSuccess} />
        </div>
      </main>
    </div>
  );
};

export default Faculty;