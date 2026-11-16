package com.attendanceio.app;

import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;
import java.util.ArrayList;
import java.util.List;

/**
 * "Subjects": every subject as a bar, tightest first. The faint stretch of each bar marks that
 * subject's minimum, so a shortfall is visible at a glance. Taller widgets show more subjects.
 */
public class SubjectBarsWidget extends BaseWidget {
    private static final int[] ROWS = {R.id.bar_row_0, R.id.bar_row_1, R.id.bar_row_2, R.id.bar_row_3, R.id.bar_row_4, R.id.bar_row_5};
    private static final int[] NAMES = {R.id.bar_name_0, R.id.bar_name_1, R.id.bar_name_2, R.id.bar_name_3, R.id.bar_name_4, R.id.bar_name_5};
    private static final int[] SKIPS = {R.id.bar_skip_0, R.id.bar_skip_1, R.id.bar_skip_2, R.id.bar_skip_3, R.id.bar_skip_4, R.id.bar_skip_5};
    private static final int[] PCTS = {R.id.bar_pct_0, R.id.bar_pct_1, R.id.bar_pct_2, R.id.bar_pct_3, R.id.bar_pct_4, R.id.bar_pct_5};
    private static final int[] BARS = {R.id.bar_0, R.id.bar_1, R.id.bar_2, R.id.bar_3, R.id.bar_4, R.id.bar_5};

    /** Header and padding take ~55dp; each subject ~33dp. */
    static int rowsFor(int heightDp) {
        if (heightDp <= 0) return 4;
        return Math.max(1, Math.min(ROWS.length, (heightDp - 55) / 33));
    }

    @Override
    RemoteViews build(Context context, WidgetData data, int widthDp, int heightDp) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_bars);
        WidgetStyle.openAppOnTap(context, v, R.id.widget_root);
        for (int row : ROWS) v.setViewVisibility(row, View.GONE);

        Integer overall = data.overallPercent();
        v.setViewVisibility(R.id.bars_overall, overall == null ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.bars_overall, overall + "% overall");

        List<WidgetData.Subject> list = new ArrayList<>();
        for (WidgetData.Subject s : data.subjects) if (s.percent != null) list.add(s);
        if (list.isEmpty()) {
            v.setViewVisibility(R.id.bars_message, View.VISIBLE);
            v.setTextViewText(R.id.bars_message, "Open Attendance IO once to see your subjects here");
            return v;
        }
        v.setViewVisibility(R.id.bars_message, View.GONE);
        // Furthest below the minimum first, then fewest skips left
        list.sort((a, b) -> a.needed != b.needed ? b.needed - a.needed : a.canSkip - b.canSkip);

        int rows = rowsFor(heightDp);
        for (int i = 0; i < rows && i < list.size(); i++) {
            WidgetData.Subject s = list.get(i);
            int color = WidgetStyle.tone(s.percent, s.min);
            v.setViewVisibility(ROWS[i], View.VISIBLE);
            v.setTextViewText(NAMES[i], s.name);
            v.setTextViewText(SKIPS[i], s.needed > 0 ? "attend " + s.needed
                : s.canSkip == 0 ? "no skips" : s.canSkip + (s.canSkip == 1 ? " skip" : " skips"));
            v.setTextColor(SKIPS[i], s.needed > 0 ? WidgetStyle.RED : s.canSkip <= 1 ? WidgetStyle.AMBER : WidgetStyle.MUTED);
            v.setTextViewText(PCTS[i], s.percent + "%");
            v.setTextColor(PCTS[i], color);
            v.setProgressBar(BARS[i], 100, s.percent, false);
            v.setInt(BARS[i], "setSecondaryProgress", s.min);
            WidgetStyle.tintProgress(v, BARS[i], color);
        }
        if (list.size() > rows) {
            v.setViewVisibility(R.id.bars_message, View.VISIBLE);
            v.setTextViewText(R.id.bars_message, "+" + (list.size() - rows) + " more · resize to see all");
        }
        return v;
    }
}
