package com.attendanceio.app;

import android.content.Context;
import android.os.Build;
import android.util.TypedValue;
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
        sizeRing(v, widthDp, heightDp - (roomy && p != null ? 24 : 0));
        return v;
    }

    /**
     * A 1×1 cell is smaller on some launchers than others, so the ring fills whatever box the widget
     * really gets (with room to breathe) instead of a fixed size that can be clipped at the edges.
     */
    private static void sizeRing(RemoteViews v, int widthDp, int heightDp) {
        int box = Math.min(widthDp, heightDp);
        if (box <= 0) return; // size not reported yet: keep the layout's default
        int ring = Math.max(40, Math.min(120, box - 24));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            v.setViewLayoutWidth(R.id.mini_ring_box, ring, TypedValue.COMPLEX_UNIT_DIP);
            v.setViewLayoutHeight(R.id.mini_ring_box, ring, TypedValue.COMPLEX_UNIT_DIP);
        } else {
            ring = 52; // older Android can't resize views in a widget
        }
        v.setTextViewTextSize(R.id.mini_percent, TypedValue.COMPLEX_UNIT_SP, Math.max(12, Math.min(28, ring * 0.3f)));
        // "OVERALL" only where the ring is wide enough inside to hold it
        v.setViewVisibility(R.id.mini_caption, ring >= 60 ? View.VISIBLE : View.GONE);
        v.setTextViewTextSize(R.id.mini_caption, TypedValue.COMPLEX_UNIT_SP, Math.max(7, Math.min(10, ring * 0.11f)));
    }
}
