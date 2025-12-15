import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { SemesterSelector, availableSemesters, Semester } from "@/components/filters/SemesterSelector";

// Mock analytics data with semester association
const allSemesterData: Record<string, {
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  above70: number;
  below60: number;
  distribution: { name: string; value: number; color: string }[];
  ranges: { range: string; count: number }[];
}> = {
  "2025 Winter": {
    totalStudents: 749,
    totalSubjects: 28,
    averageAttendance: 77.66,
    above70: 580,
    below60: 85,
    distribution: [
      { name: "Above 70%", value: 65, color: "hsl(var(--success))" },
      { name: "60-75%", value: 20, color: "hsl(var(--warning))" },
      { name: "Below 60%", value: 15, color: "hsl(var(--destructive))" },
    ],
    ranges: [
      { range: "0-20%", count: 15 },
      { range: "20-40%", count: 30 },
      { range: "40-60%", count: 40 },
      { range: "60-70%", count: 120 },
      { range: "70-80%", count: 200 },
      { range: "80-90%", count: 220 },
      { range: "90-100%", count: 124 },
    ],
  },
  "2025 Summer": {
    totalStudents: 720,
    totalSubjects: 26,
    averageAttendance: 72.34,
    above70: 520,
    below60: 100,
    distribution: [
      { name: "Above 70%", value: 55, color: "hsl(var(--success))" },
      { name: "60-75%", value: 25, color: "hsl(var(--warning))" },
      { name: "Below 60%", value: 20, color: "hsl(var(--destructive))" },
    ],
    ranges: [
      { range: "0-20%", count: 25 },
      { range: "20-40%", count: 45 },
      { range: "40-60%", count: 50 },
      { range: "60-70%", count: 130 },
      { range: "70-80%", count: 190 },
      { range: "80-90%", count: 180 },
      { range: "90-100%", count: 100 },
    ],
  },
  "2024 Winter": {
    totalStudents: 744,
    totalSubjects: 26,
    averageAttendance: 62.46,
    above70: 380,
    below60: 220,
    distribution: [
      { name: "Above 70%", value: 45, color: "hsl(var(--success))" },
      { name: "60-75%", value: 25, color: "hsl(var(--warning))" },
      { name: "Below 60%", value: 30, color: "hsl(var(--destructive))" },
    ],
    ranges: [
      { range: "0-20%", count: 40 },
      { range: "20-40%", count: 80 },
      { range: "40-60%", count: 100 },
      { range: "60-70%", count: 150 },
      { range: "70-80%", count: 180 },
      { range: "80-90%", count: 120 },
      { range: "90-100%", count: 74 },
    ],
  },
  "2024 Summer": {
    totalStudents: 428,
    totalSubjects: 24,
    averageAttendance: 59.82,
    above70: 171,
    below60: 200,
    distribution: [
      { name: "Above 70%", value: 40, color: "hsl(var(--success))" },
      { name: "60-75%", value: 15, color: "hsl(var(--warning))" },
      { name: "Below 60%", value: 45, color: "hsl(var(--destructive))" },
    ],
    ranges: [
      { range: "0-20%", count: 50 },
      { range: "20-40%", count: 60 },
      { range: "40-60%", count: 90 },
      { range: "60-70%", count: 80 },
      { range: "70-80%", count: 70 },
      { range: "80-90%", count: 50 },
      { range: "90-100%", count: 28 },
    ],
  },
  "2023 Winter": {
    totalStudents: 383,
    totalSubjects: 22,
    averageAttendance: 32.87,
    above70: 80,
    below60: 280,
    distribution: [
      { name: "Above 70%", value: 20, color: "hsl(var(--success))" },
      { name: "60-75%", value: 10, color: "hsl(var(--warning))" },
      { name: "Below 60%", value: 70, color: "hsl(var(--destructive))" },
    ],
    ranges: [
      { range: "0-20%", count: 100 },
      { range: "20-40%", count: 120 },
      { range: "40-60%", count: 60 },
      { range: "60-70%", count: 50 },
      { range: "70-80%", count: 30 },
      { range: "80-90%", count: 15 },
      { range: "90-100%", count: 8 },
    ],
  },
};

const semesterWiseData = [
  { semester: "2025 Winter", percentage: 77.66, students: 749, color: "hsl(var(--success))" },
  { semester: "2025 Summer", percentage: 72.34, students: 720, color: "hsl(var(--success))" },
  { semester: "2024 Winter", percentage: 62.46, students: 744, color: "hsl(var(--warning))" },
  { semester: "2024 Summer", percentage: 59.82, students: 428, color: "hsl(var(--warning))" },
  { semester: "2023 Winter", percentage: 32.87, students: 383, color: "hsl(var(--destructive))" },
];

export default function Analytics() {
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);

  // Get aggregated stats or specific semester stats
  const stats = useMemo(() => {
    if (!selectedSemester) {
      // Aggregate all semesters
      const allStats = Object.values(allSemesterData);
      const totalStudents = allStats.reduce((sum, s) => sum + s.totalStudents, 0);
      const totalSubjects = allStats.reduce((sum, s) => sum + s.totalSubjects, 0);
      const avgAttendance = allStats.reduce((sum, s) => sum + s.averageAttendance * s.totalStudents, 0) / totalStudents;
      const above70 = allStats.reduce((sum, s) => sum + s.above70, 0);
      const below60 = allStats.reduce((sum, s) => sum + s.below60, 0);

      return {
        totalStudents,
        totalSubjects,
        averageAttendance: Math.round(avgAttendance * 100) / 100,
        above70,
        below60,
        distribution: [
          { name: "Above 70%", value: 49, color: "hsl(var(--success))" },
          { name: "60-75%", value: 11, color: "hsl(var(--warning))" },
          { name: "Below 60%", value: 40, color: "hsl(var(--destructive))" },
        ],
        ranges: [
          { range: "0-20%", count: 180 },
          { range: "20-40%", count: 220 },
          { range: "40-60%", count: 350 },
          { range: "60-70%", count: 420 },
          { range: "70-80%", count: 480 },
          { range: "80-90%", count: 390 },
          { range: "90-100%", count: 277 },
        ],
      };
    }
    return allSemesterData[selectedSemester.label] || allSemesterData["2025 Winter"];
  }, [selectedSemester]);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header with Semester Selector */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              {selectedSemester ? `${selectedSemester.label} statistics` : "Overall attendance statistics"}
            </p>
          </div>
          <SemesterSelector
            selectedSemester={selectedSemester}
            onSemesterChange={setSelectedSemester}
            semesters={availableSemesters}
          />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Total Students</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Across {stats.totalSubjects} subjects</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Average</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className={cn(
              "text-2xl font-bold",
              stats.averageAttendance >= 70 ? "text-success" :
              stats.averageAttendance >= 60 ? "text-warning" : "text-destructive"
            )}>
              {stats.averageAttendance}%
            </p>
            <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full",
                  stats.averageAttendance >= 70 ? "bg-success" :
                  stats.averageAttendance >= 60 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${stats.averageAttendance}%` }}
              />
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Above 70%</span>
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">{stats.above70.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.above70 / stats.totalStudents) * 100)}% of students
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Below 60%</span>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.below60.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.below60 / stats.totalStudents) * 100)}% of students
            </p>
          </div>
        </div>

        {/* Semester-wise Stats - Only show when viewing all semesters */}
        {!selectedSemester && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="font-semibold mb-1">Attendance by Semester</h3>
            <p className="text-xs text-muted-foreground mb-4">Percentage for each term</p>
            
            <div className="grid grid-cols-2 gap-3">
              {semesterWiseData.map((item) => (
                <button
                  key={item.semester}
                  onClick={() => {
                    const sem = availableSemesters.find(s => s.label === item.semester);
                    if (sem) setSelectedSemester(sem);
                  }}
                  className="bg-background rounded-lg p-3 border border-border text-left hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium">{item.semester}</span>
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    item.percentage >= 70 ? "text-success" : 
                    item.percentage >= 60 ? "text-warning" : "text-destructive"
                  )}>
                    {item.percentage}%
                  </p>
                  <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        item.percentage >= 70 ? "bg-success" : 
                        item.percentage >= 60 ? "bg-warning" : "bg-destructive"
                      )}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.students} students</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Distribution Pie Chart */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-1">Attendance Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Students by attendance ranges</p>
          
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={stats.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stats.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {stats.distribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Range Bar Chart */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-1">Attendance Range Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Histogram of student percentages</p>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.ranges}>
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
}
