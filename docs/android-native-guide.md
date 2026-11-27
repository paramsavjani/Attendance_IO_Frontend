# Android native features: a beginner's guide

This explains the parts of Attendance IO that are **real Android code** rather than the React app:
home-screen widgets, marking from a notification, and app-icon shortcuts. It assumes you know the
web side (React/TypeScript) and nothing about Android.

---

## 0. The big picture: what Capacitor is

The app you know is a React website. **Capacitor** wraps that website in a real Android app:

```
┌──────────────── Android app (APK / AAB) ────────────────┐
│  MainActivity  (one Android screen)                       │
│   └─ WebView  ← shows dist/ (your React build)            │
│                                                           │
│  Capacitor "bridge": JS ⇄ Java                            │
│   JS calls  Plugin.method({...})  →  Java @PluginMethod   │
│                                                           │
│  Pure Android parts (no WebView involved):                │
│   widgets, notification buttons, alarms, shortcuts        │
└───────────────────────────────────────────────────────────┘
```

* `android/` is a normal Android Studio project. `npx cap sync android` copies `dist/` and the
  plugin list into it.
* **Over-the-air (OTA) updates** (`@capgo/capacitor-updater`, configured in
  `capacitor.config.ts`) replace only the website part. Anything under `android/` (Java, XML,
  icons, widgets, shortcuts, permissions) is compiled into the APK and **needs a new Play Store
  release (AAB)**. This is the most important rule to remember.
* Code that runs when the app is **closed** (a widget redrawing, a notification button) can't
  use the WebView. It has to be Java.

### Words you'll see

| Term | Meaning |
|---|---|
| **Activity** | One screen. We have `MainActivity` (the WebView) and `MarkActivity` (a small dialog). |
| **BroadcastReceiver** | A class Android wakes up to handle an event (alarm fired, button tapped, phone rebooted), even when the app is closed. Must finish fast. |
| **Intent** | A message: "open this screen" or "deliver this event to that receiver", with extras attached. |
| **PendingIntent** | An Intent you hand to *another* app (the launcher, the notification system) so it can fire it later on your behalf. Widgets and notification buttons work through these. |
| **SharedPreferences** | Small key/value storage on the phone, readable from Java any time. Like `localStorage` for native code. |
| **AndroidManifest.xml** | The app's declaration: which activities, receivers, permissions and widgets exist. If it's not in the manifest, Android doesn't know about it. |
| **`res/`** | Resources: `layout/` (screen XML), `drawable/` (images and shapes), `xml/` (configs like widget info or shortcuts), `values/strings.xml` (text). Referred to in Java as `R.layout.x`, `R.drawable.y`. |

### How JS talks to Java: our local plugin

`WidgetBridgePlugin.java` is a **local Capacitor plugin** (it lives in this project, not in npm):

```java
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        String snapshot = call.getString("snapshot");   // argument from JS
        ...
        call.resolve();                                  // JS promise resolves
    }
}
```

It must be registered in `MainActivity.onCreate` **before** `super.onCreate`:

```java
registerPlugin(WidgetBridgePlugin.class);
```

On the JS side (`src/lib/widgetBridge.ts`):

```ts
const WidgetBridge = registerPlugin<WidgetBridgePlugin>("WidgetBridge");
await WidgetBridge.update({ snapshot: JSON.stringify(data), token, apiBase });
```

`Capacitor.isPluginAvailable("WidgetBridge")` is false on the web and on old APKs, so every JS
call checks `available()` first. An OTA bundle can reach phones with an older APK, so always
guard new native calls like this.

Methods we added: `update`, `clear`, `status` (widget counts), `setClassCheck`, `getClassCheck`,
`takeMarks`, `canPin`, `pin`.

---

## 1. Home-screen widgets

### How a widget works (the key idea)

A widget is **not** a live view of your app. The launcher draws it from a description called
**RemoteViews** ("show this layout, put this text in that TextView"). Your code runs briefly to
produce that description, then stops. So:

* **No React, no network calls in the widget.** It only draws data that's already on the phone.
* The app **pushes a snapshot** to the phone's storage; the widget reads it whenever it redraws.

### The data flow

```
Dashboard.tsx (effect, when timetable/stats change)
   → updateWidget(days, subjects)            src/lib/widgetBridge.ts
   → WidgetBridge.update({ snapshot })       JS → Java
   → SharedPreferences "attendance_widget" / "snapshot" = JSON
   → BaseWidget.refreshAll()                 redraw every widget now
        → WidgetData.load()  parses the JSON
        → each widget's build() returns RemoteViews
        → AppWidgetManager.updateAppWidget(id, views)
```

The snapshot holds **7 days** of classes, so "Now / Next" and tomorrow keep working while the
app is closed. Widgets also redraw every 30 minutes on their own (`updatePeriodMillis`).

### The files for one widget (Streak as the example)

1. **Layout** `res/layout/widget_streak.xml`: plain XML views (LinearLayout, TextView,
   ImageView, ProgressBar). Widgets support only a limited set of views, so no custom views or
   ConstraintLayout.
2. **Info** `res/xml/widget_streak_info.xml`: size and behaviour:
   ```xml
   <appwidget-provider
       android:initialLayout="@layout/widget_streak"
       android:minWidth="110dp" android:minHeight="110dp"
       android:targetCellWidth="2" android:targetCellHeight="2"
       android:resizeMode="horizontal|vertical"
       android:previewImage="@drawable/widget_streak_preview_image"
       android:updatePeriodMillis="1800000"
       android:widgetCategory="home_screen" />
   ```
3. **Provider class** `StreakWidget.java` extends our `BaseWidget` and only implements `build()`:
   ```java
   RemoteViews build(Context context, WidgetData data, int widthDp, int heightDp) {
       RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_streak);
       WidgetStyle.openAppOnTap(context, v, R.id.widget_root);   // tap opens the app
       v.setTextViewText(R.id.streak_count, String.valueOf(data.streak));
       v.setTextColor(R.id.streak_count, WidgetStyle.TEXT);
       return v;
   }
   ```
   `BaseWidget` handles the Android callbacks (`onUpdate`, resize) and passes the real size in
   dp, so a widget can show more when it's bigger.
4. **Manifest** registers it as a receiver:
   ```xml
   <receiver android:name=".StreakWidget" android:exported="false" android:label="@string/widget_streak_label">
       <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
       <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_streak_info" />
   </receiver>
   ```
5. **Label and description** in `res/values/strings.xml`.
6. **Preview image** `res/drawable-nodpi/widget_streak_preview_image.png`, shown in the
   launcher's widget list. We take a screenshot of the real widget on the emulator. The same PNG
   goes in `public/widgets/` for the in-app sheet.
7. Add the class to `BaseWidget.ALL` (so `refreshAll` redraws it), to `status()` and `pin()` in
   `WidgetBridgePlugin`, and to `WidgetKind` in `widgetBridge.ts`.

### Things that need special handling in widgets

* **Clicks** use `setOnClickPendingIntent(viewId, pendingIntent)`. The Ask AI widget's chips use
  a different PendingIntent per chip (unique request code) with a link like
  `com.attendanceio.app://open?page=assistant&q=...`.
* **Charts and rings** can't be custom views, so we **draw a Bitmap** with `Canvas`
  (`TrendWidget.drawChart`, `MiniPercentWidget.drawRing`) at the screen's density and set it
  with `setImageViewBitmap`. Drawing at the real density is what made the 1x1 ring sharp.
* **Colours** at runtime: `setTextColor`, and for ProgressBars `setColorStateList(..., "setProgressTintList", ...)` on Android 12+.
* **Sizes** at runtime (Android 12+): `setViewLayoutWidth/Height`.
* **Data the widget needs from the server** (trend, streak) is fetched by the **app**
  (`refreshWidgetProgress`) and added to the snapshot. The widget itself never calls the network.

### Adding a widget from inside the app

`AppWidgetManager.requestPinAppWidget(ComponentName)` (in `pin()`) asks the launcher to show its
own "Add to home screen" sheet. Some launchers (ColorOS on Oppo/Realme/OnePlus) say they support
it and then refuse, so the app falls back to showing manual steps.

---

## 2. Marking from the notification

Goal: 5 minutes after a class ends, show "Software Engineering just ended. Were you there?" with
**Present / Absent / Cancelled** buttons that work without opening the app.

### Pieces (`ClassCheck.java`, `ClassCheckReceiver.java`)

1. **Scheduling with AlarmManager.** After every snapshot update, `ClassCheck.schedule()` looks
   through the next 7 days of classes, finds the earliest "class end + 5 min" in the future, and
   sets **one** alarm:
   ```java
   alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, dueIntent);
   ```
   `dueIntent` is a PendingIntent that delivers action `ACTION_DUE` to `ClassCheckReceiver`.
   `setAndAllowWhileIdle` fires even in battery-saving Doze. It isn't to-the-second exact, which
   is fine here and avoids needing the exact-alarm permission.
2. **The alarm fires** → `ClassCheckReceiver.onReceive` → `ClassCheck.onDue()`:
   * finds classes that ended in the last hour, aren't marked and weren't already asked about
     (it checks the server with `GET /api/attendance?date=` and its own "notified" list);
   * posts a notification for each, then schedules the next alarm.
3. **The notification** (`NotificationCompat.Builder`) on channel `class_check`:
   ```java
   .addAction(0, "Present",   markIntent(context, t, "present", 0))
   .addAction(0, "Absent",    markIntent(context, t, "absent", 1))
   .addAction(0, "Cancelled", markIntent(context, t, "cancelled", 2))
   ```
   Each button is a PendingIntent to `ClassCheckReceiver` with action `ACTION_MARK` and the class
   details as extras. Android 8+ needs a **notification channel**; Android 13+ needs the
   `POST_NOTIFICATIONS` permission (in the manifest, and the user has to allow it).
4. **A button is tapped** → receiver → `ClassCheck.mark()`:
   * reads the **token and API URL** the app saved (`ClassCheck.saveAuth`, called from
     `WidgetBridge.update`);
   * sends `POST /api/attendance` with plain Java `HttpURLConnection`;
   * replaces the notification with the result ("Marked present · saved", or "will sync");
   * updates the widget snapshot so the Today widget shows the new status;
   * records the mark in a **hand-off list** (`native_marks` in SharedPreferences). The app
     collects it next time it opens; unsent ones join the offline queue (see
     `docs/offline-marking.md`).
5. **Network on a receiver.** `onReceive` must return quickly and can't do network on the main
   thread, so it calls `goAsync()`, does the work on a background `Thread`, then
   `pending.finish()`.
6. **Surviving reboots and updates.** Alarms are wiped by a reboot or an app update, so the
   receiver also listens for `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED` (manifest + the
   `RECEIVE_BOOT_COMPLETED` permission) and calls `schedule()` again. After an update it also
   redraws all widgets.

### Avoiding double reminders

The server used to send an "after lecture" push. For students on a build with this feature, the
app turns that push off (`adoptClassCheck` in `widgetBridge.ts` sends
`afterLectureReminderEnabled: false`) and the phone asks instead. The Profile → Notifications
"After lecture" switch controls the phone version through `setClassCheck`.

---

## 3. Long-press app-icon shortcuts (Ask AI, Search, Profile)

These are **static shortcuts**: defined in XML, shipped in the APK.

1. **`res/xml/shortcuts.xml`** lists them:
   ```xml
   <shortcut android:shortcutId="assistant"
             android:icon="@drawable/shortcut_assistant"
             android:shortcutShortLabel="@string/shortcut_assistant_short">
       <intent android:action="android.intent.action.VIEW"
               android:data="com.attendanceio.app://open?page=assistant"
               android:targetPackage="com.attendanceio.app"
               android:targetClass="com.attendanceio.app.MainActivity" />
   </shortcut>
   ```
   Android shows at most 4 to 5. Icons are adaptive icons: a colour background
   (`drawable-anydpi-v26/shortcut_x.xml` + `values/colors.xml`) and a white glyph
   (`drawable/shortcut_x_fg.xml`).
2. **Manifest**, inside `MainActivity`:
   ```xml
   <meta-data android:name="android.app.shortcuts" android:resource="@xml/shortcuts" />
   <intent-filter>
       <action android:name="android.intent.action.VIEW" />
       <category android:name="android.intent.category.DEFAULT" />
       <data android:scheme="com.attendanceio.app" android:host="open" />
   </intent-filter>
   ```
   The intent-filter says: "links starting with `com.attendanceio.app://open` open
   MainActivity". This is a **deep link**.
3. **The React side** (`ShortcutLinks` in `src/App.tsx`) receives the link through
   `@capacitor/app`:
   * `App.getLaunchUrl()` gives the link that **started** the app (it was closed);
   * `App.addListener("appUrlOpen", ...)` fires when the app was **already open**.

   It reads `page` (and `q`) and calls React Router's `navigate("/assistant")`,
   `"/search"` or `"/profile"`. The Ask AI widget's chips use the same deep link with `&q=...`,
   and the Assistant page asks that question automatically.

**To add a shortcut:** add a `<shortcut>` to `shortcuts.xml` with a new `page=` value, add an
icon and a label, and add the page to `SHORTCUT_PAGES` in `App.tsx`. The XML part needs a new
AAB; the `App.tsx` part ships OTA.

---

## 4. What we changed around Capacitor and the build

* **Local plugin** `WidgetBridgePlugin` registered in `MainActivity` (above).
* **New Java classes**: `BaseWidget`, `WidgetData`, `WidgetStyle`, the widget providers
  (`TodayWidgetProvider`, `SubjectBarsWidget`, `MiniPercentWidget`, `AskAiWidget`,
  `TrendWidget`, `StreakWidget`), `ClassCheck`, `ClassCheckReceiver`, `MarkActivity`.
* **Manifest**: the receivers above, the deep-link intent-filter, the shortcuts meta-data, and
  permissions `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE` (plus `INTERNET`).
* **`gradle.properties`**: `android.r8.optimizedResourceShrinking=true` (Play's optimisation
  warning), with `res/raw/keep.xml` protecting notification icons that are looked up by name.
* **Not changed**: Capacitor itself is still version 7 and the Android Gradle Plugin is 8.13.
  AGP 9 needs Capacitor 8 first, a bigger planned upgrade (every plugin, plus making sure OTA
  bundles never reach phones on the old APK).
* **OTA** (`capacitor.config.ts` → `CapacitorUpdater`): unchanged. `autoUpdate: true` downloads
  new web bundles from our backend and applies them when the app goes to the background.

---

## 5. Building, testing and releasing yourself

### One-time setup
* Android Studio (it brings the SDK and an emulator), or the command-line SDK in `~/Android/Sdk`.
* A JDK 21. We use `~/Android/jdk`: `export JAVA_HOME=~/Android/jdk ANDROID_HOME=~/Android/Sdk`.

### Everyday loop
```bash
npm run build                 # React → dist/
npx cap sync android          # copy dist/ and plugins into android/
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/AttendanceIo-1.0-debug.apk
```
Or open the `android/` folder in Android Studio and press Run.

* **See Java logs and crashes:** `adb logcat` (crashes: `adb logcat -b crash`).
* **See the WebView console:** open `chrome://inspect` in desktop Chrome while a debug build runs.
* **Test a widget:** long-press the emulator's home screen → Widgets → Attendance IO.
* **Test a deep link without the icon:**
  `adb shell am start -a android.intent.action.VIEW -d "com.attendanceio.app://open?page=search" com.attendanceio.app`
* **Gotcha:** after `adb shell am force-stop`, Android delivers nothing to the app (no widget
  redraws, no alarms) until it's opened again. Real Play Store updates don't do this.

### Releasing
* Push to `main`: the **Build Android APK** GitHub workflow builds a signed APK and AAB, and
  creates a release `v1.0.<run number>` with the run number as version code. The same push also
  publishes the OTA web bundle.
* **Only JS/CSS changed?** The OTA update is enough.
* **Anything under `android/` changed?** Upload the AAB in Play Console → Production → Create
  new release, then send it for review.
* To force everyone onto a new APK, raise `critical-build` in the backend's
  `application-prod.yaml` (**after** Google approves the release).
