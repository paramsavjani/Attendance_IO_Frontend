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
    LAB_TIMETABLE: `${API_BASE_URL}/api/lab-timetable`,
    TUTORIAL_TIMETABLE: `${API_BASE_URL}/api/tutorial-timetable`,
    MARK_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    GET_MY_ATTENDANCE: `${API_BASE_URL}/api/attendance`,
    GET_LAB_TUTORIAL_ATTENDANCE: `${API_BASE_URL}/api/attendance/lab-tutorial`,
    DELETE_ATTENDANCE: (attendanceId: string) => `${API_BASE_URL}/api/attendance/${attendanceId}`,
    CLASSES_START_DATE: `${API_BASE_URL}/api/config/classes-start-date`,
    CLASSES_END_DATE: `${API_BASE_URL}/api/config/classes-end-date`,
    SUBMIT_FEEDBACK: `${API_BASE_URL}/api/feedback`,
    ANALYTICS: `${API_BASE_URL}/api/analytics`,
    ANALYTICS_SEMESTER: (semesterId: string) => `${API_BASE_URL}/api/analytics/semester/${semesterId}`,
    ANALYTICS_SEMESTERS: `${API_BASE_URL}/api/analytics/semesters`,
    CONTRIBUTORS: (type?: string) => type ? `${API_BASE_URL}/api/contributors?type=${type}` : `${API_BASE_URL}/api/contributors`,
    TRACK_EVENT: `${API_BASE_URL}/api/event/track`,
    CHECK_APP_UPDATE: `${API_BASE_URL}/api/app/check-update`,
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

/**
 * Interface for app update check response
 */
export interface AppUpdateResponse {
  isUpdateRequired: boolean;
  isCritical: boolean;
  title: string;
  message: string;
}

/**
 * Get the current app build number from Capacitor
 * Falls back to 0 for web or if Capacitor is not available
 */
export async function getAppBuildNumber(): Promise<number> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) {
      // For web, return 0 (no update check needed on web)
      return 0;
    }

    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    
    // Build number is available as 'build' property in Capacitor App.getInfo()
    // It's a string, so we need to parse it
    const buildNumber = parseInt(info.build || '0', 10);
    return isNaN(buildNumber) ? 0 : buildNumber;
  } catch (error) {
    console.error('Error getting app build number:', error);
    return 0;
  }
}

/**
 * Check if app update is required
 * This endpoint does not require authentication
 */
export async function checkAppUpdate(): Promise<AppUpdateResponse | null> {
  try {
    const buildNumber = await getAppBuildNumber();
    
    // Skip update check for web (build number is 0)
    if (buildNumber === 0) {
      return null;
    }

    const response = await fetch(API_CONFIG.ENDPOINTS.CHECK_APP_UPDATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buildNumber: buildNumber,
      }),
    });

    if (!response.ok) {
      console.error('Failed to check app update:', response.status);
      return null;
    }

    const data: AppUpdateResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking app update:', error);
    return null;
  }
}
