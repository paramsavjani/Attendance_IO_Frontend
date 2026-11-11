package com.attendanceio.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Path;
import android.view.View;
import android.widget.RemoteViews;
import java.util.List;

/** Weekly trend: overall % at the end of each recent week as a line, against the student's minimum. */
public class TrendWidget extends BaseWidget {
    @Override
    RemoteViews build(Context context, WidgetData data, int widthDp, int heightDp) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_trend);
        WidgetStyle.openAppOnTap(context, v, R.id.widget_root);
        List<WidgetData.TrendPoint> points = data.trend;
        int min = data.averageMin();

        if (points.size() < 2) {
            v.setViewVisibility(R.id.trend_chart, View.GONE);
            v.setViewVisibility(R.id.trend_message, View.VISIBLE);
            v.setTextViewText(R.id.trend_message, points.isEmpty()
                ? "Open Attendance IO to load your trend"
                : "Your trend appears after your first full week");
            Integer now = points.isEmpty() ? data.overallPercent() : Integer.valueOf(points.get(0).percent);
            v.setTextViewText(R.id.trend_now, WidgetStyle.percentText(now));
            v.setTextViewText(R.id.trend_range, "");
            v.setViewVisibility(R.id.trend_delta, View.GONE);
            return v;
        }

        WidgetData.TrendPoint last = points.get(points.size() - 1);
        int delta = last.percent - points.get(points.size() - 2).percent;
        v.setViewVisibility(R.id.trend_chart, View.VISIBLE);
        v.setViewVisibility(R.id.trend_message, View.GONE);
        v.setTextViewText(R.id.trend_now, last.percent + "%");
        v.setTextViewText(R.id.trend_range, "Last " + points.size() + " weeks");
        v.setViewVisibility(R.id.trend_delta, View.VISIBLE);
        v.setTextViewText(R.id.trend_delta, delta == 0 ? "Same as last week"
            : (delta > 0 ? "▲ " : "▼ ") + Math.abs(delta) + "% this week");
        v.setTextColor(R.id.trend_delta, delta > 0 ? WidgetStyle.GREEN : delta < 0 ? WidgetStyle.RED : WidgetStyle.MUTED);

        // Chart fills the space under the header: widget minus padding (32dp) and header (~60dp)
        int chartW = Math.max(120, (widthDp > 0 ? widthDp : 300) - 32);
        int chartH = Math.max(40, (heightDp > 0 ? heightDp : 160) - 74);
        v.setImageViewBitmap(R.id.trend_chart, drawChart(context, points, min, chartW, chartH));
        return v;
    }

    private static Bitmap drawChart(Context context, List<WidgetData.TrendPoint> points, int min, int wDp, int hDp) {
        float density = Math.min(context.getResources().getDisplayMetrics().density, 3f);
        int w = Math.round(wDp * density), h = Math.round(hDp * density);
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);

        int lo = min, hi = min;
        for (WidgetData.TrendPoint p : points) {
            lo = Math.min(lo, p.percent);
            hi = Math.max(hi, p.percent);
        }
        lo = Math.max(0, lo - 3);
        hi = Math.min(100, hi + 3);
        float pad = 7 * density;
        float span = Math.max(1, hi - lo);
        float stepX = (w - 2 * pad) / (points.size() - 1);

        // The minimum, dashed, so a dip under it is obvious
        Paint dash = new Paint(Paint.ANTI_ALIAS_FLAG);
        dash.setStyle(Paint.Style.STROKE);
        dash.setStrokeWidth(1.5f * density);
        dash.setColor(0x80F87171);
        dash.setPathEffect(new DashPathEffect(new float[]{5 * density, 5 * density}, 0));
        float minY = pad + (h - 2 * pad) * (1 - (min - lo) / span);
        c.drawLine(0, minY, w, minY, dash);

        Path line = new Path();
        for (int i = 0; i < points.size(); i++) {
            float x = pad + i * stepX;
            float y = pad + (h - 2 * pad) * (1 - (points.get(i).percent - lo) / span);
            if (i == 0) line.moveTo(x, y); else line.lineTo(x, y);
        }
        Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG);
        stroke.setStyle(Paint.Style.STROKE);
        stroke.setStrokeWidth(3f * density);
        stroke.setStrokeCap(Paint.Cap.ROUND);
        stroke.setStrokeJoin(Paint.Join.ROUND);
        stroke.setColor(WidgetStyle.ACCENT);
        c.drawPath(line, stroke);

        Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
        for (int i = 0; i < points.size(); i++) {
            float x = pad + i * stepX;
            float y = pad + (h - 2 * pad) * (1 - (points.get(i).percent - lo) / span);
            boolean newest = i == points.size() - 1;
            dot.setColor(newest ? WidgetStyle.TEXT : WidgetStyle.ACCENT);
            c.drawCircle(x, y, (newest ? 4.5f : 3f) * density, dot);
        }
        return bmp;
    }
}
