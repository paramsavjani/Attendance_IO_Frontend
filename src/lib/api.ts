/**
 * API Configuration
 * Centralized backend URL configuration using environment variables
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    OAUTH_GOOGLE: `${API_BASE_URL}/oauth2/authorization/google`,
    USER_ME: `${API_BASE_URL}/api/user/me`,
    USER_LOGOUT: `${API_BASE_URL}/api/user/logout`,
    SEMESTER_CURRENT: `${API_BASE_URL}/api/semester/current`,
    SEARCH_STUDENTS: `${API_BASE_URL}/api/search/students`,
    STUDENT_ATTENDANCE: (studentId: string) => `${API_BASE_URL}/api/search/student/${studentId}/attendance`,
    SUBJECTS_CURRENT: `${API_BASE_URL}/api/subjects/current`,
    ENROLLED_SUBJECTS: `${API_BASE_URL}/api/student/enrollment/subjects`,
    UPDATE_MINIMUM_CRITERIA: `${API_BASE_URL}/api/student/enrollment/minimum-criteria`,
    TIMETABLE: `${API_BASE_URL}/api/timetable`,
    MARK_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    DELETE_ATTENDANCE: (attendanceId: string) => `${API_BASE_URL}/api/attendance/${attendanceId}`,
  },
} as const;

/**
 * Helper function to build API URLs
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
}

