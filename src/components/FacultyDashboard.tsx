import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLeetCodeStats } from "@/hooks/useLeetCodeStats";
import { useToast } from "@/hooks/use-toast";
import { Search, LogOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Student {
  id: string;
  name: string;
  roll_number: string;
  branch: string;
  section: string;
  leetcode_username: string;
}

interface StudentWithStats extends Student {
  problemsSolved: number;
  isLoading: boolean;
  hasError: boolean;
}

const StudentRow = ({ student, onStatsUpdate }: { student: Student; onStatsUpdate?: (id: string, payload: { totalSolved?: number; score?: number } | null) => void }) => {
  const { stats, loading, error } = useLeetCodeStats(student.leetcode_username);
  useEffect(() => {
    if (onStatsUpdate) {
      if (!loading) {
        if (error || !stats) {
          onStatsUpdate(student.id, null);
        } else {
          const score = (stats.easySolved ?? 0) + 2 * (stats.mediumSolved ?? 0) + 3 * (stats.hardSolved ?? 0);
          onStatsUpdate(student.id, { totalSolved: stats.totalSolved, score });
        }
      }
    }
  }, [loading, error, stats?.totalSolved, onStatsUpdate, student.id]);
  
  return (
    <TableRow>
      <TableCell className="font-medium">{student.name}</TableCell>
      <TableCell>{student.roll_number}</TableCell>
      <TableCell>{student.branch}</TableCell>
      <TableCell>{student.section}</TableCell>
      <TableCell>{student.leetcode_username}</TableCell>
      <TableCell>
        {loading ? (
          <Badge variant="secondary">Loading...</Badge>
        ) : error ? (
          <Badge variant="destructive">Error</Badge>
        ) : stats ? (
          <Badge variant="default">{stats.totalSolved}</Badge>
        ) : (
          <Badge variant="secondary">N/A</Badge>
        )}
      </TableCell>
      <TableCell>
        {loading ? (
          <Badge variant="secondary">Loading...</Badge>
        ) : error ? (
          <Badge variant="destructive">Error</Badge>
        ) : stats ? (
          <Badge variant="outline">{(stats.easySolved ?? 0) + 2 * (stats.mediumSolved ?? 0) + 3 * (stats.hardSolved ?? 0)}</Badge>
        ) : (
          <Badge variant="secondary">N/A</Badge>
        )}
      </TableCell>
      <TableCell>
        {stats && !error && !loading ? (
          <div className="text-sm text-muted-foreground">
            Easy: {stats.easySolved} | Medium: {stats.mediumSolved} | Hard: {stats.hardSolved}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>
    </TableRow>
  );
};

interface FacultyDashboardProps {
  onLogout: () => void;
}

export const FacultyDashboard = ({ onLogout }: FacultyDashboardProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [sortByProblems, setSortByProblems] = useState<'none' | 'asc' | 'desc'>("none");
  const [statsById, setStatsById] = useState<Record<string, number | undefined>>({});
  const [scoresById, setScoresById] = useState<Record<string, number | undefined>>({});
  const [rollType, setRollType] = useState<'ALL' | 'REGULAR' | 'LE'>("ALL");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedSection, rollType, sortByProblems, statsById]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    const rollRanges: Record<string, { REGULAR: Array<[string, string]>; LE: Array<[string, string]> }> = {
      A: {
        REGULAR: [["23211A6701", "23211A6764"]],
        LE: [["24215A6701", "24215A6707"]]
      },
      B: {
        REGULAR: [["23211A6765", "23211A67C7"]],
        LE: [["24215A6708", "24215A6714"]]
      }
    };

    const compareRoll = (a: string, b: string) => (a === b ? 0 : a < b ? -1 : 1);
    const inRange = (value: string, [start, end]: [string, string]) => compareRoll(value, start) >= 0 && compareRoll(value, end) <= 0;
    const isRegular = (section: string, roll: string) => {
      const sec = rollRanges[section as keyof typeof rollRanges];
      if (!sec) return false;
      return sec.REGULAR.some((r) => inRange(roll, r));
    };
    const isLE = (section: string, roll: string) => {
      const sec = rollRanges[section as keyof typeof rollRanges];
      if (!sec) return false;
      return sec.LE.some((r) => inRange(roll, r));
    };

    const matchesSearch = (student: Student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSection = (student: Student) =>
      selectedSection === "ALL" || student.section === selectedSection;

    const matchesRollType = (student: Student) => {
      if (rollType === "ALL") return true;
      // Normalize spaces and case in roll number
      const roll = student.roll_number.replace(/\s+/g, '').toUpperCase();
      const section = student.section.toUpperCase();
      if (rollType === "REGULAR") return isRegular(section, roll);
      return isLE(section, roll);
    };

    let filtered = students.filter((student) => matchesSearch(student) && matchesSection(student) && matchesRollType(student));

    if (sortByProblems !== "none") {
      filtered = [...filtered].sort((a, b) => {
        const aVal = typeof statsById[a.id] === "number" ? (statsById[a.id] as number) : -1;
        const bVal = typeof statsById[b.id] === "number" ? (statsById[b.id] as number) : -1;
        return sortByProblems === "desc" ? bVal - aVal : aVal - bVal;
      });
    } else {
      // Default ordering: roll number ascending within the filtered set
      filtered = [...filtered].sort((a, b) => compareRoll(a.roll_number.replace(/\s+/g, '').toUpperCase(), b.roll_number.replace(/\s+/g, '').toUpperCase()));
    }

    setFilteredStudents(filtered);
  };

  const handleStatsUpdate = (id: string, payload: { totalSolved?: number; score?: number } | null) => {
    if (!payload) {
      setStatsById((prev) => ({ ...prev, [id]: undefined }));
      setScoresById((prev) => ({ ...prev, [id]: undefined }));
      return;
    }
    const { totalSolved, score } = payload;
    if (typeof totalSolved === "number") {
      setStatsById((prev) => (prev[id] === totalSolved ? prev : { ...prev, [id]: totalSolved }));
    }
    if (typeof score === "number") {
      setScoresById((prev) => (prev[id] === score ? prev : { ...prev, [id]: score }));
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Roll Number",
      "Branch",
      "Section",
      "LeetCode Username",
      "Problems Solved",
      "Score"
    ];
    const rows = filteredStudents.map((s) => {
      const solved = typeof statsById[s.id] === "number" ? (statsById[s.id] as number) : "";
      const score = typeof scoresById[s.id] === "number" ? (scoresById[s.id] as number) : "";
      return [
        s.name,
        s.roll_number,
        s.branch,
        s.section,
        s.leetcode_username,
        solved,
        score
      ];
    });

    const escapeCell = (cell: string | number) => {
      const value = String(cell ?? "");
      if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Generate filename with timestamp and date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS format
    const filename = `${dateStr}_${timeStr}.csv`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading Dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button onClick={exportToCSV} variant="default">Export to Excel (CSV)</Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student LeetCode Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={selectedSection} onValueChange={(value) => setSelectedSection(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sections</SelectItem>
                  {Array.from(new Set(students.map((s) => s.section))).sort().map((section) => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* <Select value={rollType} onValueChange={(value: 'ALL' | 'REGULAR' | 'LE') => setRollType(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Roll Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roll Types</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                  <SelectItem value="LE">Lateral Entry</SelectItem>
                </SelectContent>
              </Select> */}
              <Select value={sortByProblems} onValueChange={(value: 'none' | 'asc' | 'desc') => setSortByProblems(value)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default (Roll Number)</SelectItem>
                  <SelectItem value="desc">Problems Solved: High to Low</SelectItem>
                  <SelectItem value="asc">Problems Solved: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>LeetCode Username</TableHead>
                    <TableHead>Problems Solved</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Breakdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No students found matching your search." : "No students registered yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <StudentRow key={student.id} student={student} onStatsUpdate={handleStatsUpdate} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};