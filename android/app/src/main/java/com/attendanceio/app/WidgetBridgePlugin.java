package com.attendanceio.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Lets the web app hand the home-screen widget a snapshot of the coming days' classes.
 * The widget never talks to the network itself; it only draws the last snapshot it was given.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String snapshot = call.getString("snapshot");
        if (snapshot == null) {
            call.reject("snapshot is required");
            return;
        }
        getContext()
            .getSharedPreferences(TodayWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(TodayWidgetProvider.KEY_SNAPSHOT, snapshot)
            .apply();
        BaseWidget.refreshAll(getContext());
        call.resolve();
    }

    /** How many of each widget this student has on their home screen, for usage analytics. */
    @PluginMethod
    public void status(PluginCall call) {
        AppWidgetManager manager = AppWidgetManager.getInstance(getContext());
        JSObject counts = new JSObject();
        counts.put("today", manager.getAppWidgetIds(new ComponentName(getContext(), TodayWidgetProvider.class)).length);
        counts.put("subjects", manager.getAppWidgetIds(new ComponentName(getContext(), SubjectBarsWidget.class)).length);
        counts.put("mini", manager.getAppWidgetIds(new ComponentName(getContext(), MiniPercentWidget.class)).length);
        call.resolve(counts);
    }

    /** On logout: the widget must not keep showing the previous student's classes. */
    @PluginMethod
    public void clear(PluginCall call) {
        getContext()
            .getSharedPreferences(TodayWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(TodayWidgetProvider.KEY_SNAPSHOT)
            .apply();
        BaseWidget.refreshAll(getContext());
        call.resolve();
    }
}
