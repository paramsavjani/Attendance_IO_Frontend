package com.attendanceio.app;

import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

/** Streak: days in a row, among days with a class marked, where every marked class was present. */
public class StreakWidget extends BaseWidget {
    @Override
    RemoteViews build(Context context, WidgetData data, int widthDp, int heightDp) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_streak);
        WidgetStyle.openAppOnTap(context, v, R.id.widget_root);

        if (data.streak == null) {
            v.setTextViewText(R.id.streak_count, "–");
            v.setTextViewText(R.id.streak_label, "day streak");
            v.setTextViewText(R.id.streak_best, "Open the app to load it");
            return v;
        }
        int n = data.streak;
        // No flame until there's a streak to keep
        v.setTextViewText(R.id.streak_icon, n > 0 ? "🔥" : "💤");
        v.setTextViewText(R.id.streak_count, String.valueOf(n));
        v.setTextColor(R.id.streak_count, n > 0 ? WidgetStyle.TEXT : WidgetStyle.MUTED);
        v.setTextViewText(R.id.streak_label, "day streak");
        boolean roomy = heightDp <= 0 || heightDp >= 110;
        v.setViewVisibility(R.id.streak_best, roomy ? View.VISIBLE : View.GONE);
        v.setTextViewText(R.id.streak_best, n > 0 && n >= data.bestStreak ? "Your best yet"
            : "Best: " + data.bestStreak + (data.bestStreak == 1 ? " day" : " days"));
        return v;
    }
}
