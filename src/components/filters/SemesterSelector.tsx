import { useState, useMemo } from "react";
import { ChevronDown, Search, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface Semester {
  year: number;
  term: "Winter" | "Summer" | "Fall" | "Spring";
  label: string;
}

interface SemesterSelectorProps {
  selectedSemester: Semester | null;
  onSemesterChange: (semester: Semester | null) => void;
  semesters: Semester[];
  showAllOption?: boolean;
  className?: string;
}

export function SemesterSelector({
  selectedSemester,
  onSemesterChange,
  semesters,
  showAllOption = true,
  className,
}: SemesterSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredSemesters = useMemo(() => {
    if (!search) return semesters;
    const searchLower = search.toLowerCase();
    return semesters.filter((sem) =>
      sem.label.toLowerCase().includes(searchLower) ||
      sem.year.toString().includes(search) ||
      sem.term.toLowerCase().includes(searchLower)
    );
  }, [semesters, search]);

  const handleSelect = (semester: Semester | null) => {
    onSemesterChange(semester);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm font-medium transition-colors hover:bg-muted",
            className
          )}
        >
          <GraduationCap className="w-4 h-4 text-muted-foreground" />
          <span className="truncate max-w-[120px]">
            {selectedSemester ? selectedSemester.label : "All Semesters"}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-card border-border" align="end">
        {/* Search input */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search semester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-background"
          />
        </div>

        {/* Semester list */}
        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {showAllOption && (
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                selectedSemester === null
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              )}
            >
              All Semesters
            </button>
          )}
          {filteredSemesters.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No semesters found
            </p>
          )}
          {filteredSemesters.map((semester) => (
            <button
              key={semester.label}
              onClick={() => handleSelect(semester)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                selectedSemester?.label === semester.label
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              )}
            >
              {semester.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Predefined semesters
export const availableSemesters: Semester[] = [
  { year: 2025, term: "Winter", label: "2025 Winter" },
  { year: 2025, term: "Summer", label: "2025 Summer" },
  { year: 2024, term: "Winter", label: "2024 Winter" },
  { year: 2024, term: "Summer", label: "2024 Summer" },
  { year: 2023, term: "Winter", label: "2023 Winter" },
  { year: 2023, term: "Summer", label: "2023 Summer" },
  { year: 2022, term: "Winter", label: "2022 Winter" },
  { year: 2022, term: "Summer", label: "2022 Summer" },
];
