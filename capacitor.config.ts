import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.attendanceio.app',
  appName: 'Attendance IO',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    // Over-the-air web bundle updates, self-hosted: the backend answers /api/app/update and
    // serves the zips (see WebBundleService there and .github/workflows/publish-web-bundle.yml
    // here). Checked on every foreground; a new bundle downloads quietly and is applied the
    // next time the app goes to the background, so nobody sees a reload mid-use.
    CapacitorUpdater: {
      autoUpdate: true,
      updateUrl: 'https://api.attendanceio.paramsavjani.in/api/app/update',
      statsUrl: '',
      resetWhenUpdate: true,
      appReadyTimeout: 10000
    }
  }
};

export default config;

