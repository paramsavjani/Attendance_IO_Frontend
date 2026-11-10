package com.attendanceio.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Bundle;
import android.widget.RemoteViews;

/**
 * Every home-screen widget draws from the same snapshot; each subclass only decides how it looks.
 * Widgets are told their size so they can show more or less as the student resizes them.
 */
abstract class BaseWidget extends AppWidgetProvider {
    static final Class<?>[] ALL = {TodayWidgetProvider.class, SubjectBarsWidget.class, MiniPercentWidget.class};

    abstract RemoteViews build(Context context, WidgetData data, int widthDp, int heightDp);

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        WidgetData data = WidgetData.load(context);
        for (int id : appWidgetIds) draw(context, manager, id, this, data);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        draw(context, manager, appWidgetId, this, WidgetData.load(context));
    }

    private static void draw(Context context, AppWidgetManager manager, int id, BaseWidget widget, WidgetData data) {
        Bundle options = manager.getAppWidgetOptions(id);
        boolean portrait = context.getResources().getConfiguration().orientation != Configuration.ORIENTATION_LANDSCAPE;
        // Launchers report a range; in portrait the real box is min width × max height
        int width = options.getInt(portrait ? AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH : AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH);
        int height = options.getInt(portrait ? AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT : AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT);
        manager.updateAppWidget(id, widget.build(context, data, width, height));
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        WidgetData data = WidgetData.load(context);
        for (Class<?> cls : ALL) {
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, cls));
            if (ids.length == 0) continue;
            try {
                BaseWidget widget = (BaseWidget) cls.getDeclaredConstructor().newInstance();
                for (int id : ids) draw(context, manager, id, widget, data);
            } catch (Exception ignored) {
                // a widget that fails to draw keeps its last picture
            }
        }
    }
}
