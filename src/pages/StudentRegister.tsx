import { StudentRegistration } from "@/components/StudentRegistration";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const StudentRegister = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">LeetCode Tracker</h1>
          <Link to="/faculty">
            <Button variant="outline">Faculty Login</Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Welcome Students!</h2>
            <p className="text-muted-foreground">Register to track your LeetCode progress</p>
          </div>
          <StudentRegistration />
        </div>
      </main>
    </div>
  );
};

export default StudentRegister;