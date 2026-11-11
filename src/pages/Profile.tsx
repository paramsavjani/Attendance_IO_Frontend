import { useState, useEffect } from "react";
import { getClassCheck, getWidgetCounts, hasAdoptedClassCheck, setClassCheck, totalWidgets } from "@/lib/widgetBridge";
import { WidgetsSheet } from "@/components/widgets/WidgetsSheet";
import { useCloseOnBack } from "@/lib/backOverlay";
import { useNavigate } from "react-router-dom";
import { useAuth, trackAppEvent } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";

import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Edit, LayoutGrid, Target, Save, Moon, MessageSquare, MapPin, BarChart3, Star, Bell, ArrowUpRight, Github, Users, Inbox } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { SettingsGroup, SettingsRow } from "@/components/profile/SettingsGroup";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { Input } from "@/components/ui/input";
import { SubjectSelector } from "@/components/subjects/SubjectSelector";
import { Subject } from "@/types/attendance";
import { toast } from "sonner";
import { fetchMyFeedback, latestReply } from "@/lib/feedback";
import { FeedbackComposer } from "@/components/feedback/FeedbackComposer";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { requestAppReview } from "@/lib/in-app-review";
import { Slider } from "@/components/ui/slider";
// import { ContributorsSection } from "@/components/contributors/ContributorsSection";
import {
  ContributorFaces,
  GitHubContributors,
  REPO_URL,
  useGitHubContributors,
} from "@/components/contributors/GitHubContributors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CurrentSemester {
  year: number;
  type: string;
}

export default function Profile() {
  const { student, logout, checkAuth } = useAuth();
  const { enrolledSubjects, setEnrolledSubjects, refreshTimetable } = useAttendance();
  const navigate = useNavigate();
  const [showSubjectEditor, setShowSubjectEditor] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showClassroomLocationModal, setShowClassroomLocationModal] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<CurrentSemester | null>(null);
  const [isLoadingSemester, setIsLoadingSemester] = useState(true);
  const [editingCriteria, setEditingCriteria] = useState<Record<string, string>>({});
  const [isSavingCriteria, setIsSavingCriteria] = useState<Record<string, boolean>>({});
  const [editingClassroomLocation, setEditingClassroomLocation] = useState<Record<string, string>>({});
  const [isSavingClassroomLocation, setIsSavingClassroomLocation] = useState<Record<string, boolean>>({});
  const [sleepDuration, setSleepDuration] = useState<number | null>(null);
  const [isLoadingSleepDuration, setIsLoadingSleepDuration] = useState(true);
  const [isEditingSleepDuration, setIsEditingSleepDuration] = useState(false);
  const [editingSleepHours, setEditingSleepHours] = useState<string>("");
  const [isSavingSleepDuration, setIsSavingSleepDuration] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(0);
  const [feedbackUnread, setFeedbackUnread] = useState(0);
  const [feedbackPreview, setFeedbackPreview] = useState<string | null>(null);
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  const [dailyReminderHours, setDailyReminderHours] = useState<number[]>([]);
  const [afterLectureReminderEnabled, setAfterLectureReminderEnabled] = useState(true);
  const [pollNotificationsEnabled, setPollNotificationsEnabled] = useState(true);
  const [classCheckOnPhone, setClassCheckOnPhone] = useState(false);
  const [classCheckEnabled, setClassCheckEnabled] = useState<boolean | null>(null);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void import("@capacitor/app").then(({ App }) => App.getInfo()).then((info) => setAppVersion(info.version)).catch(() => null);
  }, []);
  // Only app builds with widgets report counts; the web and older builds don't show the button
  const [widgetCount, setWidgetCount] = useState<number | null>(null);
  const [showWidgets, setShowWidgets] = useState(false);
  useEffect(() => {
    if (showWidgets) return;
    void getWidgetCounts().then((c) => setWidgetCount(c ? totalWidgets(c) : null));
  }, [showWidgets]);
  useEffect(() => {
    void getClassCheck().then((onPhone) => {
      setClassCheckOnPhone(onPhone !== null);
      setClassCheckEnabled(onPhone);
    });
  }, []);
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  // The phone's back button closes whichever of these is open instead of leaving Profile
  useCloseOnBack(showSubjectEditor, () => setShowSubjectEditor(false));
  useCloseOnBack(showCriteriaModal, () => setShowCriteriaModal(false));
  useCloseOnBack(showClassroomLocationModal, () => setShowClassroomLocationModal(false));
  useCloseOnBack(isEditingSleepDuration, () => setIsEditingSleepDuration(false));
  useCloseOnBack(showNotificationPreferences, () => setShowNotificationPreferences(false));
  useCloseOnBack(showAbout, () => setShowAbout(false));
  const contributors = useGitHubContributors();

  useEffect(() => {
    const fetchCurrentSemester = async () => {
      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.SEMESTER_CURRENT, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentSemester(data);
        } else if (response.status === 404) {
          // No active semester is a valid state, not an error
          setCurrentSemester(null);
        } else {
          console.error('Failed to fetch current semester:', response.status);
          toast.error('Failed to load current semester');
        }
      } catch (error) {
        console.error('Error fetching current semester:', error);
        toast.error('Error loading current semester');
      } finally {
        setIsLoadingSemester(false);
      }
    };

    fetchCurrentSemester();

    // Track profile page view
    trackAppEvent('profile_view', {
      timestamp: new Date().toISOString(),
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchSleepDuration = async () => {
      try {
        const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.GET_SLEEP_DURATION, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          setSleepDuration(data.sleepDurationHours);
        } else if (response.status === 404) {
          // Default to 8 if not set
          setSleepDuration(8);
        } else {
          console.error('Failed to fetch sleep duration:', response.status);
        }
      } catch (error) {
        console.error('Error fetching sleep duration:', error);
      } finally {
        setIsLoadingSleepDuration(false);
      }
    };

    fetchSleepDuration();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveSubjects = async (subjects: Subject[], hasConflicts?: boolean) => {
    setEnrolledSubjects(subjects);
    setShowSubjectEditor(false);

    // Refresh timetable to get the updated slots from backend
    await refreshTimetable();

    if (!hasConflicts) {
      toast.success(`Updated to ${subjects.length} subjects`);
    }
    // If hasConflicts is true, the SubjectSelector already showed the conflict modal
  };

  const handleEditCriteria = (subjectId: string, currentValue: number | null | undefined) => {
    // Use 70 as default if value is null/undefined
    const defaultValue = currentValue ?? 70;
    setEditingCriteria(prev => ({
      ...prev,
      [subjectId]: defaultValue.toString()
    }));
  };

  const handleCancelEdit = (subjectId: string) => {
    setEditingCriteria(prev => {
      const updated = { ...prev };
      delete updated[subjectId];
      return updated;
    });
  };

  const handleSaveCriteria = async (subjectId: string) => {
    const valueStr = editingCriteria[subjectId]?.trim();
    const value = valueStr === "" ? null : parseInt(valueStr, 10);

    // Validate value
    if (valueStr !== "" && (isNaN(value!) || value! < 0 || value! > 100)) {
      toast.error("Minimum criteria must be between 0 and 100");
      return;
    }

    setIsSavingCriteria(prev => ({ ...prev, [subjectId]: true }));

    try {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.UPDATE_MINIMUM_CRITERIA, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId,
          minimumCriteria: value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update minimum criteria');
      }

      // Update local state directly without API call
      setEnrolledSubjects(enrolledSubjects.map(subject =>
        subject.id === subjectId
          ? { ...subject, minimumCriteria: value }
          : subject
      ));

      toast.success("Minimum criteria updated successfully");
      handleCancelEdit(subjectId);
    } catch (error) {
      console.error('Error updating minimum criteria:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update minimum criteria');
    } finally {
      setIsSavingCriteria(prev => {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      });
    }
  };

  const handleEditSleepDuration = () => {
    setEditingSleepHours(sleepDuration?.toString() || "8");
    setIsEditingSleepDuration(true);
  };

  const handleCancelEditSleepDuration = () => {
    setIsEditingSleepDuration(false);
    setEditingSleepHours("");
  };

  const handleSaveSleepDuration = async () => {
    const hoursNum = parseInt(editingSleepHours, 10);

    // Validate value
    if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 20) {
      toast.error("Sleep duration must be less than 20 hours");
      return;
    }

    setIsSavingSleepDuration(true);
    try {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.UPDATE_SLEEP_DURATION, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sleepDurationHours: hoursNum,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update sleep duration');
      }

      setSleepDuration(hoursNum);
      setIsEditingSleepDuration(false);
      toast.success("Sleep duration updated successfully");
    } catch (error) {
      console.error('Error updating sleep duration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update sleep duration');
    } finally {
      setIsSavingSleepDuration(false);
    }
  };

  const handleEditClassroomLocation = (subjectId: string, currentValue: string | null | undefined) => {
    setEditingClassroomLocation(prev => ({
      ...prev,
      [subjectId]: currentValue ?? ""
    }));
  };

  const handleCancelEditClassroomLocation = (subjectId: string) => {
    setEditingClassroomLocation(prev => {
      const updated = { ...prev };
      delete updated[subjectId];
      return updated;
    });
  };

  const handleSaveClassroomLocation = async (subjectId: string) => {
    const value = editingClassroomLocation[subjectId]?.trim() || null;

    setIsSavingClassroomLocation(prev => ({ ...prev, [subjectId]: true }));

    try {
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.UPDATE_CLASSROOM_LOCATION, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId,
          classroomLocation: value,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update classroom location');
      }

      // Update local state directly without API call
      setEnrolledSubjects(enrolledSubjects.map(subject =>
        subject.id === subjectId
          ? { ...subject, classroomLocation: value }
          : subject
      ));

      toast.success("Classroom location updated successfully");
      handleCancelEditClassroomLocation(subjectId);
    } catch (error) {
      console.error('Error updating classroom location:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update classroom location');
    } finally {
      setIsSavingClassroomLocation(prev => {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      });
    }
  };

  const loadMyFeedback = async () => {
    const mine = await fetchMyFeedback();
    setFeedbackSent(mine.items.length);
    setFeedbackUnread(mine.unreadCount);
    const reply = mine.latestUnread ? latestReply(mine.latestUnread) : undefined;
    setFeedbackPreview(reply ? reply.body.split("\n")[0] : null);
  };

  useEffect(() => {
    void loadMyFeedback();
  }, []);

  const feedbackSummary =
    feedbackUnread > 0 && feedbackPreview
      ? `Param: ${feedbackPreview}`
      : feedbackUnread > 0
      ? `${feedbackSent} sent · ${feedbackUnread} new ${feedbackUnread === 1 ? "reply" : "replies"}`
      : feedbackSent > 0
        ? `${feedbackSent} sent · tap to see replies`
        : "Replies to what you send show up here";

  const openNotificationPreferences = () => {
    setDailyReminderHours(student?.dailyReminderHours ?? []);
    setAfterLectureReminderEnabled(student?.afterLectureReminderEnabled !== false);
    setPollNotificationsEnabled(student?.pollNotificationsEnabled !== false);
    setShowNotificationPreferences(true);
    // On builds that ask after class on the phone, that is where this setting lives
    void getClassCheck().then((onPhone) => {
      if (onPhone !== null && hasAdoptedClassCheck(student?.id)) setAfterLectureReminderEnabled(onPhone);
    });
  };

  const rateApp = async () => {
    try {
      await requestAppReview({ openPlayStoreOnly: true });
    } catch (e) {
      console.error("Rate us failed:", e);
      toast.error("Could not open review. Please try again.");
    }
  };

  const criteriaValues = new Set(enrolledSubjects.map((s) => s.minimumCriteria ?? 70));
  const criteriaSummary =
    enrolledSubjects.length === 0 ? undefined : criteriaValues.size === 1 ? `${[...criteriaValues][0]}%` : "Mixed";
  const customLocations = enrolledSubjects.filter((s) => s.classroomLocation).length;
  const afterLectureOn =
    classCheckEnabled !== null && hasAdoptedClassCheck(student?.id)
      ? classCheckEnabled
      : student?.afterLectureReminderEnabled !== false;
  const notificationsOn =
    (student?.dailyReminderHours?.length ?? 0) + (afterLectureOn ? 1 : 0) + (student?.pollNotificationsEnabled !== false ? 1 : 0);
  const noSubjects = enrolledSubjects.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-6">
      <ProfileHero
        name={student?.isDemo ? "Demo User" : student?.name}
        rollNumber={student?.rollNumber}
        pictureUrl={student?.pictureUrl}
        hasUploadedPicture={student?.hasUploadedPicture}
        canEdit={!student?.isDemo}
        semesterLabel={
          isLoadingSemester
            ? undefined
            : currentSemester
              ? `${currentSemester.year} ${currentSemester.type.charAt(0) + currentSemester.type.slice(1).toLowerCase()}`
              : null
        }
        onPhotoChanged={checkAuth}
      />

      <div className="mt-2 flex flex-col gap-5">
        <SettingsGroup title="Classes">
          <SettingsRow
            icon={BookOpen}
            tint="bg-blue-500/15 text-blue-400"
            label="Subjects"
            detail="Add or drop subjects"
            value={enrolledSubjects.length}
            onClick={() => setShowSubjectEditor(true)}
          />
          <SettingsRow
            icon={Target}
            tint="bg-violet-500/15 text-violet-400"
            label="Attendance target"
            detail="The % you want to stay above"
            value={criteriaSummary}
            disabled={noSubjects}
            onClick={() => setShowCriteriaModal(true)}
          />
          <SettingsRow
            icon={MapPin}
            tint="bg-emerald-500/15 text-emerald-400"
            label="Classrooms"
            detail={customLocations > 0 ? `${customLocations} changed by you` : "Where each lecture happens"}
            disabled={noSubjects}
            onClick={() => setShowClassroomLocationModal(true)}
          />
        </SettingsGroup>

        <SettingsGroup title="Your phone">
          {widgetCount !== null && (
            <SettingsRow
              icon={LayoutGrid}
              tint="bg-indigo-500/15 text-indigo-300"
              label="Home screen widgets"
              detail={widgetCount > 0 ? "Add another or try a new one" : "Today's classes and your % at a glance"}
              value={widgetCount > 0 ? `${widgetCount} added` : "New"}
              onClick={() => setShowWidgets(true)}
            />
          )}
          <SettingsRow
            icon={Bell}
            tint="bg-amber-500/15 text-amber-400"
            label="Notifications"
            detail="Reminders, after class and polls"
            value={`${notificationsOn} on`}
            onClick={openNotificationPreferences}
          />
          <SettingsRow
            icon={Moon}
            tint="bg-sky-500/15 text-sky-400"
            label="Sleep"
            detail="So reminders skip your night"
            value={isLoadingSleepDuration ? undefined : `${sleepDuration ?? 8} h`}
            onClick={handleEditSleepDuration}
          />
        </SettingsGroup>

        <SettingsGroup title="Feedback">
          <SettingsRow
            icon={MessageSquare}
            tint="bg-cyan-500/15 text-cyan-400"
            label="Send feedback"
            detail="Report a bug or suggest something"
            onClick={() => setShowFeedbackModal(true)}
          />
          <SettingsRow
            icon={Inbox}
            tint="bg-teal-500/15 text-teal-400"
            label="Your feedback"
            detail={feedbackSummary}
            badge={feedbackUnread}
            onClick={() => navigate("/my-feedback")}
          />
          <SettingsRow
            icon={Star}
            tint="bg-yellow-500/15 text-yellow-400"
            label="Rate on Play Store"
            detail="Helps other students find the app"
            onClick={rateApp}
          />
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow
            icon={BarChart3}
            tint="bg-pink-500/15 text-pink-400"
            label="App analytics"
            detail="How students use Attendance IO"
            onClick={() => navigate("/app-analytics")}
          />
          <SettingsRow
            icon={Users}
            tint="bg-violet-500/15 text-violet-300"
            label="Contributors"
            detail="The people who built it"
            value={contributors && contributors.length > 0 ? <ContributorFaces people={contributors} size={22} /> : undefined}
            onClick={() => setShowAbout(true)}
          />
          <SettingsRow
            icon={Github}
            tint="bg-white/[0.08] text-white/80"
            label="Source code"
            detail="Open source on GitHub"
            href={REPO_URL}
          />
        </SettingsGroup>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/[0.07] text-[14px] font-semibold text-red-400 transition-colors active:bg-red-500/15 touch-manipulation"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>

        <div className="space-y-1 text-center">
          <p className="text-[12px] text-white/40">
            Made with <span className="text-rose-400">♥</span> by{" "}
            <a
              href="https://paramsavjani.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-white/70 active:opacity-70"
            >
              Param Savjani
              <ArrowUpRight className="h-3 w-3 text-white/40" />
            </a>
          </p>
          {appVersion && <p className="text-[11px] text-white/25">Version {appVersion}</p>}
        </div>
      </div>

      {/* Sleep Duration Modal */}
      <Dialog open={isEditingSleepDuration} onOpenChange={setIsEditingSleepDuration}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[92vh] sm:max-h-[85vh] overflow-hidden p-0 flex flex-col">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-3 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Moon className="w-4 h-4 text-primary" />
                Sleep Duration
              </DialogTitle>
            </DialogHeader>
            <p className="text-[10px] text-muted-foreground mt-0.5">How many hours do you sleep?</p>
          </div>

          <div className="p-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
            {/* Value Display */}
            <div className="text-center py-2">
              <span className="text-4xl font-bold text-primary tabular-nums">{editingSleepHours}</span>
              <span className="text-lg text-muted-foreground ml-1">hours</span>
            </div>

            {/* Slider */}
            <div className="px-2">
              <Slider
                value={[parseInt(editingSleepHours) || 8]}
                onValueChange={(value) => setEditingSleepHours(value[0].toString())}
                min={1}
                max={20}
                step={1}
                disabled={isSavingSleepDuration}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>1h</span>
                <span>10h</span>
                <span>20h</span>
              </div>
            </div>
          </div>

          <div className="p-3 pt-2 flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelEditSleepDuration}
              disabled={isSavingSleepDuration}
              className="flex-1 h-10 rounded-lg text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSleepDuration}
              disabled={isSavingSleepDuration}
              className="flex-1 gap-2 h-10 rounded-lg text-sm"
            >
              {isSavingSleepDuration ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* About: the maker, links, and the people who helped */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent
          className="max-w-[92vw] sm:max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5 [&>button]:hidden"
          onOpenAutoFocus={(e) => e.preventDefault()} // don't land focus on the close button
        >
          <DialogHeader>
            <DialogTitle className="text-base">About Attendance IO</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Open source, made for DA-IICT students. Built and maintained by{" "}
            <a
              href="https://paramsavjani.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-semibold text-foreground underline decoration-white/30 underline-offset-[3px] active:opacity-70"
            >
              Param Savjani
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </p>
          <GitHubContributors />
          {/* Feature ideas and Beta testers, hidden for now. */}
          {/* <ContributorsSection className="pt-1" /> */}        </DialogContent>
      </Dialog>

      {/* Subject Editor Dialog */}
      <Dialog open={showSubjectEditor} onOpenChange={setShowSubjectEditor}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] sm:max-h-[85vh] h-[90vh] sm:h-auto overflow-hidden p-3 sm:p-4 flex flex-col top-[50%] translate-y-[-50%]">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Subjects</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <SubjectSelector
              selectedSubjects={enrolledSubjects}
              onSave={handleSaveSubjects}
              onCancel={() => setShowSubjectEditor(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Classroom Location Modal */}
      <Dialog open={showClassroomLocationModal} onOpenChange={setShowClassroomLocationModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-0 flex flex-col">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Classroom Location
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-1">Customize classroom location for each subject</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {enrolledSubjects.map((subject) => {
              const isEditing = Object.prototype.hasOwnProperty.call(editingClassroomLocation, subject.id);
              const isSaving = isSavingClassroomLocation[subject.id] || false;
              const currentValue = subject.classroomLocation ?? subject.lecturePlace ?? null;
              const displayValue = currentValue || "Not set";

              return (
                <div
                  key={subject.id}
                  className={`rounded-xl border transition-all ${isEditing
                    ? 'border-primary/30 bg-primary/5 p-4'
                    : 'border-border bg-muted/30 p-3'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: subject.color, boxShadow: `0 0 8px ${subject.color}40` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                          {displayValue}
                        </span>
                        <button
                          onClick={() => handleEditClassroomLocation(subject.id, currentValue)}
                          className="h-8 px-2.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="mt-4 space-y-4">
                      {/* Input Field */}
                      <div className="space-y-2">
                        <Input
                          value={editingClassroomLocation[subject.id] || ""}
                          onChange={(e) => setEditingClassroomLocation(prev => ({ ...prev, [subject.id]: e.target.value }))}
                          placeholder={subject.lecturePlace || "Enter classroom location"}
                          disabled={isSaving}
                          className="w-full"
                          maxLength={50}
                        />
                        {subject.lecturePlace && (
                          <p className="text-xs text-muted-foreground">
                            Default: {subject.lecturePlace}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelEditClassroomLocation(subject.id)}
                          disabled={isSaving}
                          className="flex-1 h-9 rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveClassroomLocation(subject.id)}
                          disabled={isSaving}
                          className="flex-1 h-9 rounded-lg gap-1.5"
                        >
                          {isSaving ? (
                            "Saving..."
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 pt-0">
            <Button
              variant="outline"
              onClick={() => setShowClassroomLocationModal(false)}
              className="w-full h-10 rounded-xl"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Minimum Criteria Modal - Premium Design */}
      <Dialog open={showCriteriaModal} onOpenChange={setShowCriteriaModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-0 flex flex-col">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Minimum Criteria
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-1">Set attendance targets for each subject</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {enrolledSubjects.map((subject) => {
              const isEditing = Object.prototype.hasOwnProperty.call(editingCriteria, subject.id);
              const isSaving = isSavingCriteria[subject.id] || false;
              const currentValue = subject.minimumCriteria;
              const displayValue = currentValue !== null && currentValue !== undefined ? currentValue : 70;

              return (
                <div
                  key={subject.id}
                  className={`rounded-xl border transition-all ${isEditing
                    ? 'border-primary/30 bg-primary/5 p-4'
                    : 'border-border bg-muted/30 p-3'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: subject.color, boxShadow: `0 0 8px ${subject.color}40` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold tabular-nums ${displayValue >= 75 ? 'text-emerald-500' : displayValue >= 65 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                          {displayValue}%
                        </span>
                        <button
                          onClick={() => handleEditCriteria(subject.id, currentValue)}
                          className="h-8 px-2.5 rounded-lg bg-muted/50 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="mt-4 space-y-4">
                      {/* Value Display */}
                      <div className="text-center">
                        <span className={`text-3xl font-bold tabular-nums ${parseInt(editingCriteria[subject.id]) >= 75 ? 'text-emerald-500' :
                          parseInt(editingCriteria[subject.id]) >= 65 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                          {editingCriteria[subject.id] || 0}
                        </span>
                        <span className="text-lg text-muted-foreground ml-1">%</span>
                      </div>

                      {/* Slider */}
                      <div className="px-1">
                        <Slider
                          value={[parseInt(editingCriteria[subject.id]) || 0]}
                          onValueChange={(value) => setEditingCriteria(prev => ({ ...prev, [subject.id]: value[0].toString() }))}
                          min={0}
                          max={100}
                          step={5}
                          disabled={isSaving}
                          className="w-full"
                        />
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelEdit(subject.id)}
                          disabled={isSaving}
                          className="flex-1 h-9 rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveCriteria(subject.id)}
                          disabled={isSaving}
                          className="flex-1 h-9 rounded-lg gap-1.5"
                        >
                          {isSaving ? (
                            "Saving..."
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 pt-0">
            <Button
              variant="outline"
              onClick={() => setShowCriteriaModal(false)}
              className="w-full h-10 rounded-xl"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification preferences modal */}
      <Dialog open={showNotificationPreferences} onOpenChange={setShowNotificationPreferences}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[92vh] overflow-hidden p-0 flex flex-col">
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent p-3 border-b border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Bell className="w-4 h-4 text-amber-500" />
                Notification reminders
              </DialogTitle>
            </DialogHeader>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Choose which notifications you get. You can turn any of them off.
            </p>
          </div>
          <div className="p-4 space-y-5 flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Daily reminder</Label>
              <div className="space-y-2">
                {[
                  { hour: 18, label: "6:00 PM" },
                  { hour: 20, label: "8:00 PM" },
                  { hour: 22, label: "10:00 PM" },
                ].map(({ hour, label }) => (
                  <label
                    key={hour}
                    htmlFor={`remind-${hour}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer"
                  >
                    <span className="text-xs font-semibold pointer-events-none">{label}</span>
                    <Switch
                      id={`remind-${hour}`}
                      checked={dailyReminderHours.includes(hour)}
                      onCheckedChange={(checked) => {
                        setDailyReminderHours((prev) =>
                          checked ? [...prev, hour].sort((a, b) => a - b) : prev.filter((h) => h !== hour)
                        );
                      }}
                      className="data-[state=unchecked]:bg-zinc-500 data-[state=unchecked]:border-zinc-500"
                    />
                  </label>
                ))}
              </div>
            </div>
            <label
              htmlFor="after-lecture"
              className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer"
            >
              <div className="space-y-0.5 pointer-events-none">
                <span className="text-xs font-semibold block">After lecture</span>
                <p className="text-[11px] text-muted-foreground">
                  Remind me 5 min after a class ends if I haven&apos;t marked it
                  {classCheckOnPhone ? ", with buttons to mark it right there" : ""}
                </p>
              </div>
              <Switch
                id="after-lecture"
                checked={afterLectureReminderEnabled}
                onCheckedChange={setAfterLectureReminderEnabled}
                className="data-[state=unchecked]:bg-zinc-500 data-[state=unchecked]:border-zinc-500"
              />
            </label>
            <label
              htmlFor="class-polls"
              className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer"
            >
              <div className="space-y-0.5 pointer-events-none">
                <span className="text-xs font-semibold block">Class polls</span>
                <p className="text-[11px] text-muted-foreground">Notify me when a classmate asks a poll in one of my subjects</p>
              </div>
              <Switch
                id="class-polls"
                checked={pollNotificationsEnabled}
                onCheckedChange={setPollNotificationsEnabled}
                className="data-[state=unchecked]:bg-zinc-500 data-[state=unchecked]:border-zinc-500"
              />
            </label>
          </div>
          <div className="p-2.5 pt-2 flex gap-1.5">
            <Button
              variant="outline"
              onClick={() => setShowNotificationPreferences(false)}
              disabled={savingNotificationPrefs}
              className="flex-1 h-10 rounded-lg text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setSavingNotificationPrefs(true);
                try {
                  // The phone asks after class itself; the server's push stays off so they don't both arrive
                  const onPhone = hasAdoptedClassCheck(student?.id) && (await setClassCheck(afterLectureReminderEnabled));
                  if (onPhone) setClassCheckEnabled(afterLectureReminderEnabled);
                  const res = await authenticatedFetch(API_CONFIG.ENDPOINTS.NOTIFICATION_PREFERENCES, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      dailyReminderHours,
                      afterLectureReminderEnabled: onPhone ? false : afterLectureReminderEnabled,
                      pollNotificationsEnabled,
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.error || "Failed to save");
                  }
                  await checkAuth();
                  setShowNotificationPreferences(false);
                  toast.success("Notification preferences saved");
                } catch (e) {
                  console.error(e);
                  toast.error(e instanceof Error ? e.message : "Failed to save preferences");
                } finally {
                  setSavingNotificationPrefs(false);
                }
              }}
              disabled={savingNotificationPrefs}
              className="flex-1 gap-2 h-10 rounded-lg text-sm"
            >
              {savingNotificationPrefs ? "Saving..." : <><Save className="w-3.5 h-3.5" /> Save</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <WidgetsSheet open={showWidgets} onOpenChange={setShowWidgets} />
      <FeedbackComposer
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        onSent={() => void loadMyFeedback()}
      />

    </div>

  );
}