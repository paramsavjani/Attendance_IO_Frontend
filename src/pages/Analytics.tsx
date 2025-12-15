import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { semesterHistory, currentSemester } from "@/data/semesterHistory";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Mock analytics data
const overallStats = {
  totalStudents: 2317,
  totalSubjects: 106,
  averageAttendance: 61.71,
  above70: 1131,
  below60: 925,
};

const yearWiseData = [
  { year: "First Year", id: 2025, percentage: 77.66, students: 749, color: "hsl(var(--success))" },
  { year: "Second Year", id: 2024, percentage: 62.46, students: 744, color: "hsl(var(--warning))" },
  { year: "Third Year", id: 2023, percentage: 59.82, students: 428, color: "hsl(var(--warning))" },
  { year: "Fourth Year", id: 2022, percentage: 32.87, students: 383, color: "hsl(var(--destructive))" },
];

const distributionData = [
  { name: "Above 70%", value: 49, color: "hsl(var(--success))" },
  { name: "60-75%", value: 11, color: "hsl(var(--warning))" },
  { name: "Below 60%", value: 40, color: "hsl(var(--destructive))" },
];

const rangeData = [
  { range: "0-20%", count: 180 },
  { range: "20-40%", count: 220 },
  { range: "40-60%", count: 350 },
  { range: "60-70%", count: 420 },
  { range: "70-80%", count: 480 },
  { range: "80-90%", count: 390 },
  { range: "90-100%", count: 277 },
];

export default function Analytics() {
  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Overall attendance statistics</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Total Students</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{overallStats.totalStudents.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Across {overallStats.totalSubjects} subjects</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Average</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-warning">{overallStats.averageAttendance}%</p>
            <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-warning rounded-full" style={{ width: `${overallStats.averageAttendance}%` }} />
            </div>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Above 70%</span>
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">{overallStats.above70.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">48.8% of students</p>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Below 60%</span>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">{overallStats.below60.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">39.9% of students</p>
          </div>
        </div>

        {/* Year-wise Stats */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-1">Average Attendance by Year</h3>
          <p className="text-xs text-muted-foreground mb-4">Percentage for each academic year</p>
          
          <div className="grid grid-cols-2 gap-3">
            {yearWiseData.map((item) => (
              <div key={item.id} className="bg-background rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{item.year}</span>
                  <span className="text-xs text-muted-foreground">ID: {item.id}</span>
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
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-1">Attendance Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Students by attendance ranges</p>
          
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            {distributionData.map((item, index) => (
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
            <BarChart data={rangeData}>
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

        {/* Previous Semester Attendance */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="font-semibold mb-1">Previous Semester Records</h3>
          <p className="text-xs text-muted-foreground mb-4">Your attendance history</p>
          
          <div className="space-y-2">
            {semesterHistory.map((sem) => {
              const avgPercentage = Math.round(
                sem.subjects.reduce((acc, s) => acc + (s.present / s.total) * 100, 0) / sem.subjects.length
              );
              
              return (
                <Collapsible key={`${sem.year}-${sem.term}`}>
                  <CollapsibleTrigger className="w-full bg-background rounded-xl p-3 border border-border flex items-center justify-between text-left">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">Semester {sem.semester}</p>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-medium",
                          avgPercentage >= 75 ? "bg-success/10 text-success" :
                          avgPercentage >= 60 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                        )}>
                          {avgPercentage}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{sem.term} {sem.year}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {sem.subjects.map((subject, idx) => (
                      <SubjectCard
                        key={idx}
                        name={subject.name}
                        code={subject.code}
                        color={subject.color}
                        present={subject.present}
                        absent={subject.absent}
                        total={subject.total}
                        minRequired={75}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
