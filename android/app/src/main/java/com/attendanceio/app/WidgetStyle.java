package com.attendanceio.app;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.os.Build;
import android.widget.RemoteViews;

/** Colours and small helpers shared by every widget, so they read as one family. */
final class WidgetStyle {
    static final int GREEN = Color.parseColor("#34D399");
    static final int AMBER = Color.parseColor("#FBBF24");
    static final int RED = Color.parseColor("#F87171");
    static final int ACCENT = Color.parseColor("#818CF8");
    static final int TEXT = Color.parseColor("#F4F4F5");
    static final int MUTED = Color.parseColor("#8E8D96");
    static final int FAINT = Color.parseColor("#5A5963");
    static final int DIM = Color.parseColor("#3A3940");
    static final int ACCENT_SOFT = Color.parseColor("#A5B4FC");

    /** Green at or above the minimum, amber within 5 points under it, red below that. */
    static int tone(Integer percent, int min) {
        if (percent == null) return MUTED;
        return percent >= min ? GREEN : percent >= min - 5 ? AMBER : RED;
    }

    static void openAppOnTap(Context context, RemoteViews views, int rootId) {
        Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        views.setOnClickPendingIntent(rootId,
            PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
    }

    /** Colour a ring or bar; older Android keeps the drawable's own accent colour. */
    static void tintProgress(RemoteViews views, int id, int color) {
        if (Build.VERSION.SDK_INT >= 31) {
            views.setColorStateList(id, "setProgressTintList", ColorStateList.valueOf(color));
        }
    }

    /** "08:00" → "8:00", "14:30" → "2:30" */
    static String shortTime(String hhmm) {
        try {
            int h = Integer.parseInt(hhmm.substring(0, 2));
            return (h % 12 == 0 ? 12 : h % 12) + hhmm.substring(2, 5);
        } catch (Exception e) {
            return hhmm;
        }
    }

    static String percentText(Integer p) {
        return p == null ? "–" : p + "%";
    }
}
