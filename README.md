# Attendance IO

A modern, feature-rich attendance tracking application for students. Track your daily attendance, manage your timetable, analyze your attendance trends, and stay on top of your academic performance.

![Attendance IO](public/logo.png)

## 🚀 Features

### 📅 Daily Attendance Tracking
- **One-tap attendance marking** - Mark present, absent, or cancelled classes with a single tap
- **Real-time sync** - Automatic synchronization with official institute records
- **Smart timetable** - Auto-generated timetable based on your subject schedule
- **Future date support** - Mark cancelled classes for future dates

### 📊 Analytics & Insights
- **Comprehensive analytics** - View attendance statistics across semesters
- **Visual charts** - Interactive charts showing attendance distribution and trends
- **Semester-wise breakdown** - Analyze performance by semester
- **Attendance ranges** - See how many students fall in different attendance percentage ranges

### 🔍 Search & Discovery
- **Search students** - Find any student by name or roll number
- **Cross-semester view** - View attendance history across all semesters
- **Quick access** - Fast and efficient search with real-time results

### ⏰ Smart Notifications
- **Sleep reminders** - Get smart sleep notifications based on your first lecture
- **Priority alerts** - Critical lectures get priority notifications
- **Customizable settings** - Configure sleep duration and notification preferences

### 📋 Timetable Management
- **Visual timetable** - Beautiful grid view of your weekly schedule
- **Subject assignment** - Easily assign subjects to time slots
- **Color coding** - Each subject has a unique color for easy identification
- **Flexible editing** - Add, remove, or modify your timetable anytime

### ⚠️ Smart Warnings
- **Minimum criteria alerts** - Set minimum attendance thresholds per subject
- **Risk notifications** - Get alerts when you're at risk of falling below requirements
- **Visual indicators** - Color-coded warnings for subjects needing attention

### 💬 Feedback System
- **Submit feedback** - Report bugs, provide feedback, or suggest improvements
- **Multiple types** - Categorize feedback as bug, feedback, or suggestion
- **Easy submission** - Simple form-based feedback submission

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Capacitor** - Cross-platform mobile app framework
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Beautiful, accessible component library
- **React Router** - Client-side routing
- **Recharts** - Chart library for analytics
- **TanStack Query** - Data fetching and caching
- **Sonner** - Toast notifications
- **Capacitor Android** - Native Android integration
- **Gradle** - Android build system

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Android Studio (for Android development)

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance-io-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8081
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

### Android Setup

1. **Sync Capacitor**
   ```bash
   npm run cap:sync
   ```

2. **Open Android Studio**
   ```bash
   npm run cap:open:android
   ```

3. **Build APK**
   - Open the project in Android Studio
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Or use the GitHub Actions workflow for automated builds

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run cap:sync` - Sync Capacitor native projects
- `npm run cap:copy` - Copy web assets to native projects
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run android:build` - Build and sync Android project

### Project Structure

```
attendance-io-frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── attendance/   # Attendance-related components
│   │   ├── auth/         # Authentication components
│   │   ├── subjects/     # Subject management components
│   │   ├── timetable/    # Timetable components
│   │   └── ui/           # Base UI components (Shadcn)
│   ├── contexts/         # React contexts (Auth, Attendance)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and API config
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Attendance.tsx
│   │   ├── DailyAttendance.tsx
│   │   ├── Analytics.tsx
│   │   ├── Timetable.tsx
│   │   ├── Profile.tsx
│   │   ├── Search.tsx
│   │   └── ...
│   └── types/            # TypeScript type definitions
├── android/              # Android native project
├── public/              # Static assets
├── scripts/             # Build and utility scripts
└── resources/           # App icons and logos
```

## 🔐 Authentication

The app uses OAuth2 authentication. Users authenticate through their institute's OAuth provider and are automatically registered/logged in. The authentication is handled by the backend API.

## 📱 Mobile App

### Building Android APK

The Android APK is automatically built and released via GitHub Actions when changes are pushed to the `main` branch.

**Manual Build:**
1. Ensure you have Android Studio installed
2. Run `npm run build` to build the web app
3. Run `npm run cap:sync` to sync with native projects
4. Open Android Studio and build the APK

**Automated Build:**
- Push to `main` branch triggers GitHub Actions workflow
- APK is automatically built and released
- Version is automatically incremented based on Git tags

### APK Naming

APKs are named: `AttendanceIo-{version}-{buildType}.apk`

Example: `AttendanceIo-1.0.0-release.apk`

## 🎨 UI/UX Features

- **Dark theme** - Beautiful dark mode interface
- **Responsive design** - Works on all screen sizes
- **Smooth animations** - Polished transitions and interactions
- **Accessibility** - Built with accessibility in mind
- **Modern design** - Clean, minimalist interface

## 📊 Performance Optimizations

- **Lazy loading** - Components loaded on demand
- **Code splitting** - Optimized bundle sizes
- **React Query caching** - Efficient data fetching and caching
- **Optimized re-renders** - Memoization and context optimization

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking (via TypeScript)
npm run build
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Support

For issues, questions, or feedback, please use the in-app feedback feature or contact the development team.

---

Made with ❤️ for students

**Author:** Param Savjani

