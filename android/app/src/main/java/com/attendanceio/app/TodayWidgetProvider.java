package com.attendanceio.app;

import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

/**
 * "Today's classes": each class with its time, room and attendance %, a bar in the subject's colour,
 * the one on now highlighted and finished ones faded. Taller widgets show more classes.
 * Once the day's last class has ended it moves on to the next day that has classes.
 */
public class TodayWidgetProvider extends BaseWidget {
    static final String PREFS = "attendance_widget";
    static final String KEY_SNAPSHOT = "snapshot";

    private static final int[] ROWS = {R.id.row_0, R.id.row_1, R.id.row_2, R.id.row_3, R.id.row_4, R.id.row_5};
    private static final int[] BARS = {R.id.bar_0, R.id.bar_1, R.id.bar_2, R.id.bar_3, R.id.bar_4, R.id.bar_5};
    private static final int[] TIMES = {R.id.time_0, R.id.time_1, R.id.time_2, R.id.time_3, R.id.time_4, R.id.time_5};
    private static final int[] ENDS = {R.id.end_0, R.id.end_1, R.id.end_2, R.id.end_3, R.id.end_4, R.id.end_5};
    private static final int[] NAMES = {R.id.name_0, R.id.name_1, R.id.name_2, R.id.name_3, R.id.name_4, R.id.name_5};
    private static final int[] ROOMS = {R.id.room_0, R.id.room_1, R.id.room_2, R.id.room_3, R.id.room_4, R.id.room_5};
    private static final int[] PERCENTS = {R.id.percent_0, R.id.percent_1, R.id.percent_2, R.id.percent_3, R.id.percent_4, R.id.percent_5};

    /** Header and padding take ~60dp; each class row ~45dp. */
    static int rowsFor(int heightDp) {
        if (heightDp <= 0) return 4;
        return Math.max(1, Math.min(ROWS.length, (heightDp - 60) / 45));
    }

    @Override
    RemoteViews build(Context context, WidgetData data, int widthDp, int heightDp) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_today);
        WidgetStyle.openAppOnTap(context, v, R.id.widget_root);
        for (int row : ROWS) v.setViewVisibility(row, View.GONE);
        v.setViewVisibility(R.id.widget_message, View.GONE);

        WidgetData.Day day = data.currentDay();
        if (day == null) {
            v.setTextViewText(R.id.widget_title, "Today");
            v.setTextViewText(R.id.widget_subtitle, new SimpleDateFormat("EEE d MMM", Locale.US).format(new java.util.Date()));
            v.setViewVisibility(R.id.widget_pill, View.GONE);
            message(v, data.empty ? "Open Attendance IO once to see your classes here" : "No classes coming up this week");
            return v;
        }

        boolean today = "Today".equals(day.label);
        String now = WidgetData.nowTime();
        List<WidgetData.ClassItem> classes = day.classes;
        v.setTextViewText(R.id.widget_title, day.label);
        v.setTextViewText(R.id.widget_subtitle, new SimpleDateFormat("EEE d MMM", Locale.US).format(day.date));

        // Header pill: what matters right now
        WidgetData.ClassItem next = data.nextClass(day);
        v.setViewVisibility(R.id.widget_pill, View.VISIBLE);
        if (next != null && today && WidgetData.isOn(next)) {
            v.setTextViewText(R.id.widget_pill, "Now · " + data.codeFor(next.name));
        } else if (next != null) {
            v.setTextViewText(R.id.widget_pill, (today ? "Next · " : "Starts ") + WidgetStyle.shortTime(next.start));
        } else {
            v.setTextViewText(R.id.widget_pill, classes.size() + (classes.size() == 1 ? " class" : " classes"));
        }

        // Which classes fit: everything still to come, plus as many finished ones as there is room for
        int rows = rowsFor(heightDp);
        int firstActive = 0;
        if (today) while (firstActive < classes.size() && classes.get(firstActive).end.compareTo(now) <= 0) firstActive++;
        int start = Math.max(0, Math.min(firstActive, classes.size() - rows));
        int shown = 0;
        for (int i = start; i < classes.size() && shown < rows; i++, shown++) {
            WidgetData.ClassItem c = classes.get(i);
            boolean done = today && c.end.compareTo(now) <= 0;
            boolean on = today && WidgetData.isOn(c);
            int tone = WidgetStyle.tone(c.percent, c.min);
            v.setViewVisibility(ROWS[shown], View.VISIBLE);
            v.setInt(ROWS[shown], "setBackgroundResource", on ? R.drawable.widget_row_now : 0);
            v.setInt(BARS[shown], "setColorFilter", done ? WidgetStyle.DIM : tone);
            v.setTextViewText(TIMES[shown], WidgetStyle.shortTime(c.start));
            v.setTextColor(TIMES[shown], done ? WidgetStyle.FAINT : WidgetStyle.TEXT);
            v.setTextViewText(ENDS[shown], WidgetStyle.shortTime(c.end));
            v.setTextViewText(NAMES[shown], c.name);
            v.setTextColor(NAMES[shown], done ? WidgetStyle.FAINT : WidgetStyle.TEXT);
            String place = "lecture".equals(c.type) ? c.room
                : ("lab".equals(c.type) ? "Lab" : "Tutorial") + (c.room.isEmpty() ? "" : " · " + c.room);
            // How it was marked, else whether it's on now or ended without a mark
            String label = null;
            int labelColor = WidgetStyle.MUTED;
            if ("present".equals(c.status)) { label = "Present"; labelColor = WidgetStyle.GREEN; }
            else if ("absent".equals(c.status)) { label = "Absent"; labelColor = WidgetStyle.RED; }
            else if ("cancelled".equals(c.status)) { label = "Cancelled"; labelColor = WidgetStyle.MUTED; }
            else if (on) { label = "Now"; labelColor = WidgetStyle.ACCENT_SOFT; }
            else if (done) { label = "Not marked"; labelColor = WidgetStyle.AMBER; }
            v.setTextViewText(ROOMS[shown], label == null ? place : WidgetStyle.twoTone(label, labelColor, " · " + place));
            v.setTextViewText(PERCENTS[shown], c.percent == null ? "" : c.percent + "%");
            v.setTextColor(PERCENTS[shown], done ? WidgetStyle.FAINT : tone);
        }
        int more = classes.size() - start - shown;
        if (more > 0) message(v, "+" + more + " more later");
        return v;
    }

    private static void message(RemoteViews v, String text) {
        v.setViewVisibility(R.id.widget_message, View.VISIBLE);
        v.setTextViewText(R.id.widget_message, text);
    }
}
