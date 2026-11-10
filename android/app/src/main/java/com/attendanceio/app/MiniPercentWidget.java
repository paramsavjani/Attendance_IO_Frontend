package com.attendanceio.app;

import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

/** Overall attendance in a small ring; bigger sizes add the lecture count. */
public class MiniPercentWidget extends BaseWidget {
    @Override
    RemoteViews build(Context context, WidgetData data, int widthDp, int heightDp) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_mini);
        WidgetStyle.openAppOnTap(context, v, R.id.widget_root);
        Integer p = data.overallPercent();
        int color = WidgetStyle.tone(p, data.averageMin());
        v.setProgressBar(R.id.mini_ring, 100, p == null ? 0 : p, false);
        WidgetStyle.tintProgress(v, R.id.mini_ring, color);
        v.setTextViewText(R.id.mini_percent, WidgetStyle.percentText(p));
        v.setTextColor(R.id.mini_percent, p == null ? WidgetStyle.MUTED : WidgetStyle.TEXT);
        boolean roomy = heightDp >= 130 && widthDp >= 110;
        v.setViewVisibility(R.id.mini_detail, roomy && p != null ? View.VISIBLE : View.GONE);
        v.setTextViewText(R.id.mini_detail, data.overallPresent() + " of " + data.overallTotal() + " lectures");
        return v;
    }
}
