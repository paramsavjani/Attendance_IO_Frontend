import { getToken } from './token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.attendanceio.paramsavjani.in';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    OAUTH_GOOGLE: `${API_BASE_URL}/oauth2/authorization/google`,
    OAUTH_GOOGLE_MOBILE_START: `${API_BASE_URL}/api/auth/mobile/google/start`,
    OAUTH_MOBILE_EXCHANGE: `${API_BASE_URL}/api/auth/mobile/exchange`,
    USER_ME: `${API_BASE_URL}/api/user/me`,
    USER_LOGOUT: `${API_BASE_URL}/api/user/logout`,
    UPDATE_FCM_TOKEN: `${API_BASE_URL}/api/user/fcm-token`,
    SEMESTER_CURRENT: `${API_BASE_URL}/api/semester/current`,
    SEARCH_STUDENTS: `${API_BASE_URL}/api/search/students`,
    STUDENT_ATTENDANCE: (studentId: string) => `${API_BASE_URL}/api/search/student/${studentId}/attendance`,
    SUBJECTS_CURRENT: `${API_BASE_URL}/api/subjects/current`,
    SUBJECT_SCHEDULES: (subjectIds: string[]) => `${API_BASE_URL}/api/subjects/schedules?subjectIds=${subjectIds.join(',')}`,
    ENROLLED_SUBJECTS: `${API_BASE_URL}/api/student/enrollment/subjects`,
    CHECK_SUBJECT_CONFLICTS: `${API_BASE_URL}/api/student/enrollment/subjects/check-conflicts`,
    UPDATE_MINIMUM_CRITERIA: `${API_BASE_URL}/api/student/enrollment/minimum-criteria`,
    UPDATE_CLASSROOM_LOCATION: `${API_BASE_URL}/api/student/enrollment/classroom-location`,
    GET_SLEEP_DURATION: `${API_BASE_URL}/api/student/enrollment/sleep-duration`,
    UPDATE_SLEEP_DURATION: `${API_BASE_URL}/api/student/enrollment/sleep-duration`,
    GET_BASELINE_ATTENDANCE: (subjectId: string) => `${API_BASE_URL}/api/student/enrollment/baseline-attendance/${subjectId}`,
    SAVE_BASELINE_ATTENDANCE: `${API_BASE_URL}/api/student/enrollment/baseline-attendance`,
    TIMETABLE: `${API_BASE_URL}/api/timetable`,
    MARK_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    GET_MY_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    DELETE_ATTENDANCE: (attendanceId: string) => `${API_BASE_URL}/api/attendance/${attendanceId}`,
    CLASSES_START_DATE: `${API_BASE_URL}/api/config/classes-start-date`,
    CLASSES_END_DATE: `${API_BASE_URL}/api/config/classes-end-date`,
    SUBMIT_FEEDBACK: `${API_BASE_URL}/api/feedback`,
    ANALYTICS: `${API_BASE_URL}/api/analytics`,
    ANALYTICS_SEMESTER: (semesterId: string) => `${API_BASE_URL}/api/analytics/semester/${semesterId}`,
    ANALYTICS_SEMESTERS: `${API_BASE_URL}/api/analytics/semesters`,
    CONTRIBUTORS: (type?: string) => type ? `${API_BASE_URL}/api/contributors?type=${type}` : `${API_BASE_URL}/api/contributors`,
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

/**
 * Make an authenticated API request with JWT token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}
