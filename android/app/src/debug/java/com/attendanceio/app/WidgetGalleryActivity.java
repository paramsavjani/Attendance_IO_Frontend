package com.attendanceio.app;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * Debug-only: renders every widget design at its home-screen size with the real snapshot,
 * laid out like a home screen, so the designs can be compared in one screenshot.
 * Start with: adb shell am start -n com.attendanceio.app/.WidgetGalleryActivity
 */
public class WidgetGalleryActivity extends Activity {
    // Roughly a Pixel launcher cell (narrowed slightly so four fit across this screen)
    private static final int CELL_W = 84, CELL_H = 120, GAP = 10;

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WidgetData data = WidgetData.load(this);

        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        column.setPadding(dp(16), dp(40), dp(16), dp(40));
        GradientDrawable wallpaper = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            new int[] {Color.parseColor("#3B3F8F"), Color.parseColor("#1A1B3A"), Color.parseColor("#0B0B14")});
        column.setBackground(wallpaper);

        Object[][] rows = {
            {new Object[] {"Mini %", new MiniPercentWidget(), 1, 1}, new Object[] {"Mini % (resized)", new MiniPercentWidget(), 2, 2}},
            {new Object[] {"Today's classes", new TodayWidgetProvider(), 4, 2}},
            {new Object[] {"Today's classes (resized taller)", new TodayWidgetProvider(), 4, 3}},
            {new Object[] {"Subjects", new SubjectBarsWidget(), 4, 2}},
            {new Object[] {"Subjects (resized shorter)", new SubjectBarsWidget(), 4, 1}},
        };

        for (Object[] row : rows) {
            LinearLayout line = new LinearLayout(this);
            line.setOrientation(LinearLayout.HORIZONTAL);
            for (Object o : row) {
                Object[] w = (Object[]) o;
                int cw = (Integer) w[2], ch = (Integer) w[3];
                int widthDp = cw * CELL_W + (cw - 1) * GAP, heightDp = ch * CELL_H + (ch - 1) * GAP;
                LinearLayout cell = new LinearLayout(this);
                cell.setOrientation(LinearLayout.VERTICAL);
                TextView label = new TextView(this);
                label.setText(w[0] + "  " + cw + "×" + ch);
                label.setTextColor(Color.parseColor("#E0E0FF"));
                label.setTextSize(12);
                label.setPadding(dp(4), 0, 0, dp(6));
                cell.addView(label);
                FrameLayout frame = new FrameLayout(this);
                View widget = ((BaseWidget) w[1]).build(this, data, widthDp, heightDp).apply(this, frame);
                frame.addView(widget, new FrameLayout.LayoutParams(-1, -1));
                cell.addView(frame, new LinearLayout.LayoutParams(dp(widthDp), dp(heightDp)));
                LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
                lp.setMargins(0, 0, dp(GAP), dp(18));
                line.addView(cell, lp);
            }
            column.addView(line);
        }

        ScrollView scroll = new ScrollView(this);
        scroll.setBackground(wallpaper);
        scroll.addView(column);
        setContentView(scroll);
    }
}
