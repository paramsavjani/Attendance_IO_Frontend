package com.attendanceio.app;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

/**
 * Ask AI: the bar opens the assistant; on a taller widget, each chip opens it with that question
 * already asked (com.attendanceio.app://open?page=assistant&q=...).
 */
public class AskAiWidget extends BaseWidget {
    private static final int[] CHIPS = {R.id.ask_chip_0, R.id.ask_chip_1, R.id.ask_chip_2};
    private static final String[][] QUESTIONS = {
        {"Can I skip today?", "Can I skip today's classes?"},
        {"Need for 75%?", "How many classes do I need to attend to stay above 75% in every subject?"},
        {"Plan my week", "Plan my attendance for this week: which classes can I skip and which must I attend?"},
    };

    @Override
    RemoteViews build(Context context, WidgetData data, int widthDp, int heightDp) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_ask);
        v.setOnClickPendingIntent(R.id.widget_root, open(context, 0, null));
        v.setOnClickPendingIntent(R.id.ask_bar, open(context, 0, null));

        // A 4×1 cell only fits the bar; chips appear once the widget is tall enough for them
        boolean chips = heightDp <= 0 || heightDp >= 96;
        v.setViewVisibility(R.id.ask_chips, chips ? View.VISIBLE : View.GONE);
        int fit = widthDp <= 0 ? 3 : widthDp >= 340 ? 3 : widthDp >= 230 ? 2 : 1;
        for (int i = 0; i < CHIPS.length; i++) {
            v.setViewVisibility(CHIPS[i], i < fit ? View.VISIBLE : View.GONE);
            v.setTextViewText(CHIPS[i], QUESTIONS[i][0]);
            v.setOnClickPendingIntent(CHIPS[i], open(context, i + 1, QUESTIONS[i][1]));
        }
        return v;
    }

    private static PendingIntent open(Context context, int request, String question) {
        String link = "com.attendanceio.app://open?page=assistant"
            + (question == null ? "" : "&q=" + Uri.encode(question));
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(link), context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(context, 7100 + request, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
