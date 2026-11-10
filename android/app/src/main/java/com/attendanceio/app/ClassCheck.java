package com.attendanceio.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Marking attendance without opening the app: from the after-class notification and from the
 * app-icon shortcuts. The app hands over its sign-in token and the coming days' classes (the same
 * snapshot the widgets draw); marks that can't be sent are handed back to the app, which queues
 * them like any offline mark.
 */
final class ClassCheck {
    private static final String KEY_TOKEN = "auth_token";
    private static final String KEY_API = "api_base";
    private static final String KEY_ENABLED = "class_check_enabled";
    private static final String KEY_NOTIFIED = "class_check_notified";
    private static final String KEY_HANDOFF = "native_marks";

    static final String CHANNEL = "class_check";
    static final String ACTION_DUE = "com.attendanceio.app.CLASS_CHECK_DUE";
    static final String ACTION_MARK = "com.attendanceio.app.CLASS_CHECK_MARK";

    /** Ask this long after a class ends, like the server reminder did. */
    private static final long ASK_AFTER_MS = 5 * 60_000L;
    /** An alarm the phone held back in doze still asks, unless it is this late. */
    private static final long TOO_LATE_MS = 60 * 60_000L;

    enum Result { SENT, OFFLINE, SIGNED_OUT, REFUSED }

    /** One class on one day, with everything a mark needs. */
    static final class Target {
        String date, subjectId, name, room, start, end;
        Integer slot;

        static Target of(WidgetData.Day day, WidgetData.ClassItem c) {
            Target t = new Target();
            t.date = day.key;
            t.subjectId = c.subjectId;
            t.name = c.name;
            t.room = c.room;
            t.start = c.start;
            t.end = c.end;
            t.slot = c.slot;
            return t;
        }

        String key() {
            return date + "|" + subjectId + "|" + (slot != null ? "slot" + slot : start + "-" + end);
        }

        int notificationId() {
            return 0x4000_0000 | (key().hashCode() & 0x0fff_ffff);
        }

        long endsAt() {
            return at(date, end);
        }

        long startsAt() {
            return at(date, start);
        }

        void putInto(Intent intent) {
            intent.putExtra("date", date).putExtra("subjectId", subjectId).putExtra("name", name)
                .putExtra("room", room).putExtra("start", start).putExtra("end", end)
                .putExtra("slot", slot == null ? -1 : slot);
        }

        static Target from(Intent intent) {
            Target t = new Target();
            t.date = intent.getStringExtra("date");
            t.subjectId = intent.getStringExtra("subjectId");
            t.name = intent.getStringExtra("name");
            t.room = intent.getStringExtra("room");
            t.start = intent.getStringExtra("start");
            t.end = intent.getStringExtra("end");
            int slot = intent.getIntExtra("slot", -1);
            t.slot = slot < 0 ? null : slot;
            return t;
        }

        JSONObject body(String status) throws Exception {
            JSONObject o = new JSONObject();
            o.put("subjectId", subjectId);
            o.put("lectureDate", date);
            o.put("status", status);
            if (slot != null) o.put("timeSlot", slot);
            else {
                o.put("startTime", start);
                o.put("endTime", end);
            }
            return o;
        }
    }

    private ClassCheck() {}

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(TodayWidgetProvider.PREFS, Context.MODE_PRIVATE);
    }

    static long at(String date, String time) {
        Calendar c = Calendar.getInstance();
        String[] d = date.split("-");
        String[] t = time.split(":");
        c.set(Integer.parseInt(d[0]), Integer.parseInt(d[1]) - 1, Integer.parseInt(d[2]),
            Integer.parseInt(t[0]), Integer.parseInt(t[1]), 0);
        c.set(Calendar.MILLISECOND, 0);
        return c.getTimeInMillis();
    }

    // ---- What the app hands over ----

    static void saveAuth(Context context, String token, String apiBase) {
        prefs(context).edit().putString(KEY_TOKEN, token).putString(KEY_API, apiBase).apply();
    }

    static boolean isEnabled(Context context) {
        // Off until the app turns it on, so it never doubles up with the server reminder
        return prefs(context).getBoolean(KEY_ENABLED, false);
    }

    static void setEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply();
        schedule(context);
    }

    static boolean signedIn(Context context) {
        return prefs(context).getString(KEY_TOKEN, null) != null;
    }

    /** On logout: forget the token, pending hand-offs and any alarm. */
    static void clear(Context context) {
        prefs(context).edit().remove(KEY_TOKEN).remove(KEY_API).remove(KEY_HANDOFF).remove(KEY_NOTIFIED).apply();
        schedule(context);
    }

    /** Marks made here since the app last asked, then forgets them. */
    static synchronized JSONArray takeHandoff(Context context) {
        JSONArray items = readArray(prefs(context).getString(KEY_HANDOFF, "[]"));
        prefs(context).edit().remove(KEY_HANDOFF).apply();
        return items;
    }

    private static synchronized void handOff(Context context, Target t, String status, boolean sent) {
        try {
            JSONArray items = readArray(prefs(context).getString(KEY_HANDOFF, "[]"));
            JSONObject o = new JSONObject();
            o.put("date", t.date);
            o.put("subjectId", t.subjectId);
            o.put("slot", t.slot == null ? JSONObject.NULL : t.slot);
            o.put("start", t.start);
            o.put("end", t.end);
            o.put("status", status);
            o.put("sent", sent);
            o.put("body", t.body(status));
            o.put("at", System.currentTimeMillis());
            items.put(o);
            prefs(context).edit().putString(KEY_HANDOFF, items.toString()).apply();
        } catch (Exception ignored) {
            // the server has it or the app will show the class unmarked; either way nothing is lost
        }
    }

    private static JSONArray readArray(String raw) {
        try {
            return new JSONArray(raw);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    // ---- Talking to the server (call off the main thread) ----

    static Result mark(Context context, Target t, String status) {
        String token = prefs(context).getString(KEY_TOKEN, null);
        String api = prefs(context).getString(KEY_API, null);
        if (token == null || api == null) return Result.SIGNED_OUT;
        try {
            HttpURLConnection conn = open(api + "/api/attendance", token);
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");
            try (OutputStream out = conn.getOutputStream()) {
                out.write(t.body(status).toString().getBytes(StandardCharsets.UTF_8));
            }
            int code = conn.getResponseCode();
            conn.disconnect();
            if (code >= 200 && code < 300) {
                handOff(context, t, status, true);
                showOnWidgets(context, t, status);
                return Result.SENT;
            }
            if (code == 401 || code == 403) return Result.SIGNED_OUT;
            if (code >= 500) {
                handOff(context, t, status, false);
                showOnWidgets(context, t, status);
                return Result.OFFLINE;
            }
            return Result.REFUSED;
        } catch (Exception e) {
            handOff(context, t, status, false);
            showOnWidgets(context, t, status);
            return Result.OFFLINE;
        }
    }

    /** Put the new mark in the widgets' snapshot so "Today's classes" shows it before the app is opened. */
    private static synchronized void showOnWidgets(Context context, Target t, String status) {
        try {
            SharedPreferences p = prefs(context);
            JSONObject snapshot = new JSONObject(p.getString(TodayWidgetProvider.KEY_SNAPSHOT, "{}"));
            JSONArray classes = snapshot.optJSONObject("days") == null ? null : snapshot.getJSONObject("days").optJSONArray(t.date);
            if (classes == null) return;
            for (int i = 0; i < classes.length(); i++) {
                JSONObject c = classes.getJSONObject(i);
                boolean sameSlot = t.slot != null
                    ? !c.isNull("slot") && c.optInt("slot", -1) == t.slot
                    : c.isNull("slot") && t.start.equals(c.optString("start")) && t.end.equals(c.optString("end"));
                if (t.subjectId.equals(c.optString("subjectId")) && sameSlot) c.put("status", status);
            }
            p.edit().putString(TodayWidgetProvider.KEY_SNAPSHOT, snapshot.toString()).apply();
            BaseWidget.refreshAll(context);
        } catch (Exception ignored) {
            // the widget catches up the next time the app opens
        }
    }

    /**
     * What the server has for each of `targets` on `date`: "present", "absent", "cancelled", or
     * no entry when unmarked. Null when the server can't be reached.
     */
    static JSONObject statuses(Context context, String date, List<Target> targets) {
        String token = prefs(context).getString(KEY_TOKEN, null);
        String api = prefs(context).getString(KEY_API, null);
        if (token == null || api == null) return null;
        try {
            HttpURLConnection conn = open(api + "/api/attendance?date=" + date, token);
            if (conn.getResponseCode() != 200) return null;
            JSONObject body;
            try (InputStream in = conn.getInputStream()) {
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] chunk = new byte[8192];
                for (int n; (n = in.read(chunk)) > 0; ) buf.write(chunk, 0, n);
                body = new JSONObject(buf.toString("UTF-8"));
            }
            JSONArray records = body.optJSONArray("todayAttendance");
            JSONObject result = new JSONObject();
            if (records == null) return result;
            for (Target t : targets) {
                for (int i = 0; i < records.length(); i++) {
                    JSONObject r = records.optJSONObject(i);
                    if (r == null || r.optBoolean("isExtraClass") || !t.subjectId.equals(r.optString("subjectId"))) continue;
                    boolean hasSlot = !r.isNull("timeSlot") && r.has("timeSlot");
                    boolean hasTimes = !r.isNull("startTime") && r.has("startTime");
                    boolean same = t.slot != null
                        ? (hasSlot && r.optInt("timeSlot") == t.slot) || (!hasSlot && !hasTimes)
                        : (hasTimes && t.start.equals(r.optString("startTime")) && t.end.equals(r.optString("endTime")))
                            || (!hasSlot && !hasTimes);
                    if (same) result.put(t.key(), r.optString("status"));
                }
            }
            return result;
        } catch (Exception e) {
            return null;
        }
    }

    private static HttpURLConnection open(String url, String token) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);
        conn.setRequestProperty("Authorization", "Bearer " + token);
        conn.setRequestProperty("Accept", "application/json");
        return conn;
    }

    // ---- Today's classes from the snapshot ----

    static List<Target> today(Context context) {
        List<Target> out = new ArrayList<>();
        WidgetData.Day day = WidgetData.load(context).day(0);
        for (WidgetData.ClassItem c : day.classes) {
            if (c.subjectId != null && !c.subjectId.isEmpty()) out.add(Target.of(day, c));
        }
        return out;
    }

    /** The class on now, or else the one that ended most recently today (within 90 minutes). */
    static Target current(Context context) {
        long now = System.currentTimeMillis();
        Target best = null;
        for (Target t : today(context)) {
            if (t.startsAt() <= now && t.endsAt() > now) return t;
            if (t.endsAt() <= now && now - t.endsAt() < 90 * 60_000L && (best == null || t.endsAt() > best.endsAt())) best = t;
        }
        return best;
    }

    // ---- The after-class question ----

    private static PendingIntent dueIntent(Context context) {
        Intent intent = new Intent(context, ClassCheckReceiver.class).setAction(ACTION_DUE);
        return PendingIntent.getBroadcast(context, 1, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Set one alarm for the next class to ask about; it sets the following one when it fires. */
    static void schedule(Context context) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        PendingIntent due = dueIntent(context);
        alarms.cancel(due);
        if (!isEnabled(context) || !signedIn(context)) return;

        long now = System.currentTimeMillis();
        long next = Long.MAX_VALUE;
        WidgetData data = WidgetData.load(context);
        for (int offset = 0; offset < 7; offset++) {
            WidgetData.Day day = data.day(offset);
            for (WidgetData.ClassItem c : day.classes) {
                if (c.subjectId == null || c.subjectId.isEmpty()) continue;
                long askAt = Target.of(day, c).endsAt() + ASK_AFTER_MS;
                if (askAt > now && askAt < next) next = askAt;
            }
        }
        if (next != Long.MAX_VALUE) alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, due);
    }

    /** The alarm fired: ask about every class that just ended and isn't marked yet. */
    static void onDue(Context context) {
        long now = System.currentTimeMillis();
        List<Target> ended = new ArrayList<>();
        for (Target t : today(context)) {
            long askAt = t.endsAt() + ASK_AFTER_MS;
            if (askAt <= now + 60_000L && now - askAt < TOO_LATE_MS && !alreadyAsked(context, t)) ended.add(t);
        }
        if (!ended.isEmpty() && isEnabled(context)) {
            JSONObject marked = statuses(context, ended.get(0).date, ended);
            for (Target t : ended) {
                rememberAsked(context, t);
                if (marked != null && marked.has(t.key())) continue;
                ask(context, t);
            }
        }
        schedule(context);
    }

    private static boolean alreadyAsked(Context context, Target t) {
        return prefs(context).getString(KEY_NOTIFIED, "").contains(t.key() + ";");
    }

    private static void rememberAsked(Context context, Target t) {
        String asked = prefs(context).getString(KEY_NOTIFIED, "");
        // Keep only today's keys so this never grows
        StringBuilder kept = new StringBuilder();
        for (String k : asked.split(";")) if (k.startsWith(t.date + "|")) kept.append(k).append(';');
        prefs(context).edit().putString(KEY_NOTIFIED, kept + t.key() + ";").apply();
    }

    private static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL, "After-class check", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Mark a class right from the notification when it ends");
        manager.createNotificationChannel(channel);
    }

    private static PendingIntent openApp(Context context) {
        Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, 2, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent markIntent(Context context, Target t, String status, int code) {
        Intent intent = new Intent(context, ClassCheckReceiver.class).setAction(ACTION_MARK).putExtra("status", status);
        t.putInto(intent);
        return PendingIntent.getBroadcast(context, t.notificationId() * 4 + code, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static String timeRange(Target t) {
        return clock(t.start) + "–" + clock(t.end);
    }

    /** "14:30" → "2:30 PM", how the app writes times. */
    static String clock(String hhmm) {
        String[] p = hhmm.split(":");
        int h = Integer.parseInt(p[0]);
        return (h % 12 == 0 ? 12 : h % 12) + ":" + p[1] + (h < 12 ? " AM" : " PM");
    }

    private static NotificationCompat.Builder base(Context context, Target t) {
        ensureChannel(context);
        return new NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_icon_48)
            .setColor(WidgetStyle.ACCENT)
            .setContentIntent(openApp(context))
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setOnlyAlertOnce(true)
            .setAutoCancel(true);
    }

    private static void ask(Context context, Target t) {
        String where = t.room == null || t.room.isEmpty() ? "" : " · " + t.room;
        NotificationCompat.Builder n = base(context, t)
            .setContentTitle(t.name + " just ended")
            .setContentText("Were you there? " + timeRange(t) + where)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .addAction(0, "Present", markIntent(context, t, "present", 0))
            .addAction(0, "Absent", markIntent(context, t, "absent", 1))
            .addAction(0, "Cancelled", markIntent(context, t, "cancelled", 2));
        post(context, t.notificationId(), n);
    }

    /** Replace the question with what happened to the tap. */
    static void showResult(Context context, int notificationId, Target t, String status, Result result) {
        String title;
        String text;
        long timeout = 0;
        switch (result) {
            case SENT:
                title = "Marked " + status + " · " + t.name;
                text = timeRange(t) + " · saved";
                timeout = 4000;
                break;
            case OFFLINE:
                title = "Marked " + status + " · " + t.name;
                text = "No connection. It syncs the next time you open Attendance IO.";
                timeout = 8000;
                break;
            case SIGNED_OUT:
                title = "Couldn't mark " + t.name;
                text = "Open Attendance IO and sign in to mark it.";
                break;
            default:
                title = "Couldn't mark " + t.name;
                text = "Open Attendance IO to mark it there.";
                break;
        }
        NotificationCompat.Builder n = base(context, t).setContentTitle(title).setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_LOW).setSilent(true);
        if (timeout > 0) n.setTimeoutAfter(timeout);
        post(context, notificationId, n);
    }

    private static void post(Context context, int id, NotificationCompat.Builder n) {
        try {
            NotificationManagerCompat.from(context).notify(id, n.build());
        } catch (SecurityException ignored) {
            // notifications are off for the app
        }
    }
}
