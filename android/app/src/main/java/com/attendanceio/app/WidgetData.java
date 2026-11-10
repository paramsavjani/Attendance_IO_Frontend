package com.attendanceio.app;

import android.content.Context;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** The snapshot WidgetBridgePlugin stored, parsed into what the widgets draw. */
final class WidgetData {
    static final class ClassItem {
        String start, end, name, room, type;
        Integer percent;
        int min;
    }

    static final class Subject {
        String name, code;
        int present, total, min, canSkip, needed;
        Integer percent;
    }

    /** A day with classes: "Today", "Tomorrow" or a weekday name, its date, and its classes. */
    static final class Day {
        String label;
        Date date;
        List<ClassItem> classes = new ArrayList<>();
    }

    final boolean empty;
    private final JSONObject days;
    final List<Subject> subjects = new ArrayList<>();

    private WidgetData(JSONObject days, JSONArray subjects) {
        this.empty = days == null;
        this.days = days;
        if (subjects == null) return;
        for (int i = 0; i < subjects.length(); i++) {
            JSONObject o = subjects.optJSONObject(i);
            if (o == null) continue;
            Subject s = new Subject();
            s.name = o.optString("name");
            s.code = o.optString("code");
            s.present = o.optInt("present");
            s.total = o.optInt("total");
            s.min = o.optInt("min", 75);
            s.canSkip = o.optInt("canSkip");
            s.needed = o.optInt("needed");
            s.percent = o.isNull("percent") || !o.has("percent") ? null : o.optInt("percent");
            this.subjects.add(s);
        }
    }

    static WidgetData load(Context context) {
        String raw = context.getSharedPreferences(TodayWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .getString(TodayWidgetProvider.KEY_SNAPSHOT, null);
        if (raw == null) return new WidgetData(null, null);
        try {
            JSONObject o = new JSONObject(raw);
            return new WidgetData(o.getJSONObject("days"), o.optJSONArray("subjects"));
        } catch (Exception e) {
            return new WidgetData(null, null);
        }
    }

    static String nowTime() {
        return new SimpleDateFormat("HH:mm", Locale.US).format(new Date());
    }

    /** Classes on the day `offset` days from today (0 = today). */
    Day day(int offset) {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, offset);
        Day d = new Day();
        d.date = c.getTime();
        d.label = offset == 0 ? "Today" : offset == 1 ? "Tomorrow" : new SimpleDateFormat("EEEE", Locale.US).format(d.date);
        if (days == null) return d;
        JSONArray arr = days.optJSONArray(new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(d.date));
        if (arr == null) return d;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o == null) continue;
            ClassItem ci = new ClassItem();
            ci.start = o.optString("start");
            ci.end = o.optString("end");
            ci.name = o.optString("name");
            ci.room = o.optString("room", "");
            ci.type = o.optString("type", "lecture");
            ci.percent = o.isNull("percent") || !o.has("percent") ? null : o.optInt("percent");
            ci.min = o.optInt("min", 75);
            d.classes.add(ci);
        }
        return d;
    }

    /** Today, unless its classes are all over; then the next day with classes. Null if none in the week. */
    Day currentDay() {
        String now = nowTime();
        for (int offset = 0; offset < 7; offset++) {
            Day d = day(offset);
            if (d.classes.isEmpty()) continue;
            if (offset > 0 || d.classes.get(d.classes.size() - 1).end.compareTo(now) > 0) return d;
        }
        return null;
    }

    /** The class on now, or the next one to start. */
    ClassItem nextClass(Day d) {
        if (d == null) return null;
        String now = nowTime();
        boolean isToday = "Today".equals(d.label);
        for (ClassItem c : d.classes) if (!isToday || c.end.compareTo(now) > 0) return c;
        return null;
    }

    static boolean isOn(ClassItem c) {
        String now = nowTime();
        return c.start.compareTo(now) <= 0 && c.end.compareTo(now) > 0;
    }

    /** Subject code for a class name ("Operating Systems" → "IT301"), falling back to the name. */
    String codeFor(String name) {
        for (Subject s : subjects) if (s.name.equals(name) && !s.code.isEmpty()) return s.code;
        return name;
    }

    int overallPresent() {
        int n = 0;
        for (Subject s : subjects) n += s.present;
        return n;
    }

    int overallTotal() {
        int n = 0;
        for (Subject s : subjects) n += s.total;
        return n;
    }

    Integer overallPercent() {
        int t = overallTotal();
        return t > 0 ? Math.round(overallPresent() * 100f / t) : null;
    }

    int averageMin() {
        if (subjects.isEmpty()) return 75;
        int n = 0;
        for (Subject s : subjects) n += s.min;
        return Math.round((float) n / subjects.size());
    }
}
