import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const StudentRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    branch: "",
    section: "",
    leetcodeUsername: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('students')
        .insert([
          {
            name: formData.name,
            roll_number: formData.rollNumber,
            branch: formData.branch,
            section: formData.section,
            leetcode_username: formData.leetcodeUsername
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "Roll number already exists. Please use a different roll number.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Student registered successfully!"
        });
        setFormData({
          name: "",
          rollNumber: "",
          branch: "",
          section: "",
          leetcodeUsername: ""
        });
      }
    } catch (error) {
      console.error('Error registering student:', error);
      toast({
        title: "Error",
        description: "Failed to register student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const branches = ["CSD", "CSE", "AI&DS", "AI&ML", "CS&BS", "IT"];
  const sections = ["A", "B", "C", "D"];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Student Registration</CardTitle>
        <CardDescription>Register for LeetCode tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              required
            />
          </div>

          <div>
            <Label htmlFor="rollNumber">Roll Number</Label>
            <Input
              id="rollNumber"
              type="text"
              value={formData.rollNumber}
              onChange={(e) => setFormData(prev => ({...prev, rollNumber: e.target.value}))}
              required
            />
          </div>

          <div>
            <Label htmlFor="branch">Branch</Label>
            <Select onValueChange={(value) => setFormData(prev => ({...prev, branch: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="section">Section</Label>
            <Select onValueChange={(value) => setFormData(prev => ({...prev, section: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="leetcodeUsername">LeetCode Username</Label>
            <Input
              id="leetcodeUsername"
              type="text"
              value={formData.leetcodeUsername}
              onChange={(e) => setFormData(prev => ({...prev, leetcodeUsername: e.target.value}))}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};