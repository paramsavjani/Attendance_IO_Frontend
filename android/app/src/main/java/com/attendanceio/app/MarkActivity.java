package com.attendanceio.app;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.widget.ArrayAdapter;
import android.widget.Toast;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

/**
 * The app-icon shortcuts "Mark current class" and "Mark a class": a small dialog over the home
 * screen that marks attendance without opening the app.
 */
public class MarkActivity extends AppCompatActivity {
    static final String ACTION_CURRENT = "com.attendanceio.app.MARK_CURRENT";
    static final String ACTION_PICK = "com.attendanceio.app.MARK_PICK";

    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (!ClassCheck.signedIn(this)) {
            openApp();
            return;
        }
        List<ClassCheck.Target> today = ClassCheck.today(this);
        if (today.isEmpty()) {
            Toast.makeText(this, "No classes today", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }
        ClassCheck.Target current = ACTION_CURRENT.equals(getIntent().getAction()) ? ClassCheck.current(this) : null;
        if (current != null) askStatus(current, null);
        else pickClass(today, ACTION_CURRENT.equals(getIntent().getAction()) ? "No class right now. Pick one" : "Mark a class");
    }

    private void pickClass(List<ClassCheck.Target> today, String title) {
        List<String> rows = new ArrayList<>();
        for (ClassCheck.Target t : today) rows.add(row(t, null));
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, rows);
        String[] known = new String[today.size()];

        AlertDialog dialog = new AlertDialog.Builder(this, R.style.MarkDialog)
            .setTitle(title)
            .setAdapter(adapter, (d, which) -> askStatus(today.get(which), known[which]))
            .setNegativeButton("Open app", (d, w) -> openApp())
            .setOnCancelListener(d -> finish())
            .create();
        dialog.show();

        // Show what's already marked once the server answers; the list works without it
        new Thread(() -> {
            JSONObject statuses = ClassCheck.statuses(this, today.get(0).date, today);
            if (statuses == null) return;
            main.post(() -> {
                for (int i = 0; i < today.size(); i++) {
                    known[i] = statuses.optString(today.get(i).key(), null);
                    rows.set(i, row(today.get(i), known[i]));
                }
                adapter.notifyDataSetChanged();
            });
        }).start();
    }

    private static String row(ClassCheck.Target t, String status) {
        String mark = status == null ? "" : "   ✓ " + status;
        return ClassCheck.clock(t.start) + "   " + t.name + mark;
    }

    private void askStatus(ClassCheck.Target t, String already) {
        boolean started = t.startsAt() <= System.currentTimeMillis();
        String where = t.room == null || t.room.isEmpty() ? "" : " · " + t.room;
        String message = ClassCheck.timeRange(t) + where + (already != null ? "\nMarked " + already + " now" : "");

        AlertDialog.Builder builder = new AlertDialog.Builder(this, R.style.MarkDialog)
            .setTitle(t.name)
            .setMessage(message)
            .setNegativeButton("Absent", (d, w) -> send(t, "absent"))
            .setNeutralButton("Cancelled", (d, w) -> send(t, "cancelled"))
            .setOnCancelListener(d -> finish());
        // Present has to wait for the class to start, as in the app
        if (started) builder.setPositiveButton("Present", (d, w) -> send(t, "present"));
        builder.show();
    }

    private void send(ClassCheck.Target t, String status) {
        new Thread(() -> {
            ClassCheck.Result result = ClassCheck.mark(this, t, status);
            main.post(() -> {
                String text;
                switch (result) {
                    case SENT:
                        text = "Marked " + status + " · " + t.name;
                        break;
                    case OFFLINE:
                        text = "Marked " + status + ". It syncs the next time you open the app";
                        break;
                    case SIGNED_OUT:
                        text = "Sign in to Attendance IO to mark from here";
                        break;
                    default:
                        text = "Couldn't mark it. Try in the app";
                        break;
                }
                Toast.makeText(getApplicationContext(), text, Toast.LENGTH_SHORT).show();
                if (result == ClassCheck.Result.SIGNED_OUT || result == ClassCheck.Result.REFUSED) openApp();
                else finish();
            });
        }).start();
    }

    private void openApp() {
        startActivity(new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        finish();
    }
}
