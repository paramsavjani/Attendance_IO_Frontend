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
        // Marking from a notification or shortcut sends with the app's own sign-in
        String token = call.getString("token");
        String apiBase = call.getString("apiBase");
        if (token != null && apiBase != null) ClassCheck.saveAuth(getContext(), token, apiBase);
        BaseWidget.refreshAll(getContext());
        ClassCheck.schedule(getContext());
        call.resolve();
    }

    /** Turn the after-class question on or off (the app's "After lecture" reminder setting). */
    @PluginMethod
    public void setClassCheck(PluginCall call) {
        ClassCheck.setEnabled(getContext(), Boolean.TRUE.equals(call.getBoolean("enabled", true)));
        call.resolve();
    }

    @PluginMethod
    public void getClassCheck(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", ClassCheck.isEnabled(getContext()));
        call.resolve(result);
    }

    /** Marks made from a notification or shortcut since the app last asked: `sent`, or waiting for a connection. */
    @PluginMethod
    public void takeMarks(PluginCall call) {
        JSObject result = new JSObject();
        result.put("marks", ClassCheck.takeHandoff(getContext()).toString());
        call.resolve(result);
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
        ClassCheck.clear(getContext());
        BaseWidget.refreshAll(getContext());
        call.resolve();
    }
}
