package com.attendanceio.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
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
        v.setTextViewText(R.id.mini_percent, WidgetStyle.percentText(p));
        v.setTextColor(R.id.mini_percent, p == null ? WidgetStyle.MUTED : WidgetStyle.TEXT);
        boolean roomy = heightDp >= 130 && widthDp >= 110;
        v.setViewVisibility(R.id.mini_detail, roomy && p != null ? View.VISIBLE : View.GONE);
        v.setTextViewText(R.id.mini_detail, data.overallPresent() + " of " + data.overallTotal() + " lectures");
        boolean detail = roomy && p != null;
        // Small, it's just the ring on the wallpaper; bigger, it sits on a card with the lecture count
        v.setInt(R.id.widget_root, "setBackgroundResource", detail ? R.drawable.widget_background : 0);
        int ring = sizeRing(v, widthDp, heightDp - (detail ? 24 : 0), detail);
        v.setImageViewBitmap(R.id.mini_ring_img, drawRing(context, ring, p, color));
        return v;
    }

    /**
     * A 1×1 cell is smaller on some launchers than others, so the ring fills whatever box the widget
     * really gets (with room to breathe) instead of a fixed size that can be clipped at the edges.
     */
    private static int sizeRing(RemoteViews v, int widthDp, int heightDp, boolean onCard) {
        int box = Math.min(widthDp, heightDp);
        if (box <= 0) return 52; // size not reported yet: the layout's default
        int ring = Math.max(40, Math.min(120, box - (onCard ? 24 : 14)));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            v.setViewLayoutWidth(R.id.mini_ring_box, ring, TypedValue.COMPLEX_UNIT_DIP);
            v.setViewLayoutHeight(R.id.mini_ring_box, ring, TypedValue.COMPLEX_UNIT_DIP);
        } else {
            ring = 52; // older Android can't resize views in a widget
        }
        v.setTextViewTextSize(R.id.mini_percent, TypedValue.COMPLEX_UNIT_SP, Math.max(12, Math.min(28, ring * 0.27f)));
        // "OVERALL" only where the ring is wide enough inside to hold it
        v.setViewVisibility(R.id.mini_caption, ring >= 76 ? View.VISIBLE : View.GONE);
        v.setTextViewTextSize(R.id.mini_caption, TypedValue.COMPLEX_UNIT_SP, Math.max(7, Math.min(10, ring * 0.11f)));
        return ring;
    }

    /**
     * The disc, its faint track and the coloured arc, drawn at the screen's real pixel density with
     * anti-aliasing and round ends. A ring shape drawable inside a ProgressBar is scaled by the
     * launcher instead, which left the 1×1 ring jagged.
     */
    private static Bitmap drawRing(Context context, int ringDp, Integer percent, int color) {
        float density = context.getResources().getDisplayMetrics().density;
        int px = Math.max(1, Math.round(ringDp * Math.min(density, 3.5f)));
        Bitmap bmp = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        float center = px / 2f;
        float scale = px / (float) ringDp; // pixels per dp at the size actually drawn

        Paint disc = new Paint(Paint.ANTI_ALIAS_FLAG);
        disc.setColor(0xF0121216);
        c.drawCircle(center, center, center, disc);
        Paint rim = new Paint(Paint.ANTI_ALIAS_FLAG);
        rim.setStyle(Paint.Style.STROKE);
        rim.setStrokeWidth(scale);
        rim.setColor(0x22FFFFFF);
        c.drawCircle(center, center, center - scale / 2f, rim);

        float stroke = Math.max(3f * scale, px * 0.085f);
        float inset = 3f * scale + stroke / 2f;
        RectF arc = new RectF(inset, inset, px - inset, px - inset);
        Paint track = new Paint(Paint.ANTI_ALIAS_FLAG);
        track.setStyle(Paint.Style.STROKE);
        track.setStrokeWidth(stroke);
        track.setColor(0x26FFFFFF);
        c.drawOval(arc, track);

        if (percent != null && percent > 0) {
            Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
            fill.setStyle(Paint.Style.STROKE);
            fill.setStrokeWidth(stroke);
            fill.setStrokeCap(Paint.Cap.ROUND);
            fill.setColor(color);
            c.drawArc(arc, -90f, Math.min(100, percent) * 3.6f, false, fill);
        }
        return bmp;
    }
}
