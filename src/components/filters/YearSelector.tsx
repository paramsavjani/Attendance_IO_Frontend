import { useState, useMemo } from "react";
import { ChevronDown, Search, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface YearSelectorProps {
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  startYear?: number;
  endYear?: number;
  showAllOption?: boolean;
  className?: string;
}

export function YearSelector({
  selectedYear,
  onYearChange,
  startYear = 2018,
  endYear = new Date().getFullYear(),
  showAllOption = true,
  className,
}: YearSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const years = useMemo(() => {
    const yearList: (number | null)[] = [];
    if (showAllOption) {
      yearList.push(null);
    }
    for (let y = endYear; y >= startYear; y--) {
      yearList.push(y);
    }
    return yearList;
  }, [startYear, endYear, showAllOption]);

  const filteredYears = useMemo(() => {
    if (!search) return years;
    return years.filter((year) =>
      year === null
        ? "all years".includes(search.toLowerCase())
        : year.toString().includes(search)
    );
  }, [years, search]);

  const handleSelect = (year: number | null) => {
    onYearChange(year);
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
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{selectedYear ? `${selectedYear}` : "All Years"}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-card border-border" align="start">
        {/* Search input */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-background"
          />
        </div>

        {/* Year list */}
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filteredYears.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No years found
            </p>
          )}
          {filteredYears.map((year) => (
            <button
              key={year ?? "all"}
              onClick={() => handleSelect(year)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                (year === selectedYear || (year === null && selectedYear === null))
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              )}
            >
              {year ?? "All Years"}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
