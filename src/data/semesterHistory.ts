export interface SemesterData {
  year: number;
  term: 'Winter' | 'Summer' | 'Fall' | 'Spring';
  semester: number;
  subjects: {
    id: string;
    name: string;
    code: string;
    color: string;
    present: number;
    absent: number;
    total: number;
  }[];
}

export const semesterHistory: SemesterData[] = [
  {
    year: 2024,
    term: 'Fall',
    semester: 3,
    subjects: [
      { id: "s3-1", name: "Discrete Mathematics", code: "CS201", color: "200 80% 50%", present: 38, absent: 2, total: 40 },
      { id: "s3-2", name: "Data Communication", code: "CS202", color: "160 70% 45%", present: 35, absent: 5, total: 40 },
      { id: "s3-3", name: "Object Oriented Programming", code: "CS203", color: "30 90% 55%", present: 36, absent: 4, total: 40 },
      { id: "s3-4", name: "Digital Logic", code: "CS204", color: "300 70% 50%", present: 32, absent: 8, total: 40 },
    ],
  },
  {
    year: 2024,
    term: 'Spring',
    semester: 2,
    subjects: [
      { id: "s2-1", name: "Programming Fundamentals", code: "CS101", color: "220 85% 55%", present: 42, absent: 3, total: 45 },
      { id: "s2-2", name: "Calculus II", code: "MA102", color: "140 65% 40%", present: 40, absent: 5, total: 45 },
      { id: "s2-3", name: "Physics II", code: "PH102", color: "40 85% 50%", present: 38, absent: 7, total: 45 },
      { id: "s2-4", name: "English Communication", code: "EN101", color: "280 65% 55%", present: 43, absent: 2, total: 45 },
    ],
  },
  {
    year: 2023,
    term: 'Fall',
    semester: 1,
    subjects: [
      { id: "s1-1", name: "Introduction to Computing", code: "CS100", color: "210 75% 50%", present: 44, absent: 1, total: 45 },
      { id: "s1-2", name: "Calculus I", code: "MA101", color: "150 70% 45%", present: 41, absent: 4, total: 45 },
      { id: "s1-3", name: "Physics I", code: "PH101", color: "35 80% 50%", present: 39, absent: 6, total: 45 },
      { id: "s1-4", name: "Technical Writing", code: "EN100", color: "270 60% 50%", present: 42, absent: 3, total: 45 },
    ],
  },
];

export const currentSemester = {
  year: 2025,
  term: 'Winter' as const,
  semester: 4,
};
