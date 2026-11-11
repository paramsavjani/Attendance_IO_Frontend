package com.attendanceio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarms for the after-class question, taps on its buttons, and re-arming after a reboot or update. */
public class ClassCheckReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;
        Context app = context.getApplicationContext();
        PendingResult pending = goAsync();
        new Thread(() -> {
            try {
                if (ClassCheck.ACTION_DUE.equals(action)) {
                    ClassCheck.onDue(app);
                } else if (ClassCheck.ACTION_MARK.equals(action)) {
                    ClassCheck.Target t = ClassCheck.Target.from(intent);
                    String status = intent.getStringExtra("status");
                    ClassCheck.Result result = ClassCheck.mark(app, t, status);
                    ClassCheck.showResult(app, t.notificationId(), t, status, result);
                } else {
                    // BOOT_COMPLETED, MY_PACKAGE_REPLACED: alarms don't survive either, and after an
                    // update the widgets are redrawn with the new version's layouts
                    ClassCheck.schedule(app);
                    BaseWidget.refreshAll(app);
                }
            } finally {
                pending.finish();
            }
        }).start();
    }
}
