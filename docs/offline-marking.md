# How offline marking works

Attendance IO keeps working with no internet: the app opens on its last data, and a student can
mark classes; the marks are sent when the phone is back online. This document explains every
piece, where it lives, and how to change or rebuild it by hand.

There are **four parts**, and they are independent of each other:

| # | Part | File | Stored in |
|---|------|------|-----------|
| 1 | **Read cache**: last good copy of the data the app needs to open | `src/lib/offlineCache.ts` + `authenticatedFetch` in `src/lib/api.ts` | `localStorage["attendance_io_offline_cache_v1"]` |
| 2 | **Write queue**: marks that couldn't be sent | `src/lib/offlineQueue.ts` | `localStorage["attendance_io_offline_queue_v1"]` |
| 3 | **Marking + sync logic**: puts marks in the queue, shows them, sends them later | `src/contexts/AttendanceContext.tsx` | React state |
| 4 | **Native hand-off**: marks made from the notification while the app was closed | `android/.../ClassCheck.java` → `takeNativeMarks()` in `src/lib/widgetBridge.ts` | Android `SharedPreferences` `attendance_widget` → `native_marks` |

`localStorage` lives inside the app's WebView on the phone. It survives closing the app and
phone restarts; it is wiped on logout (we clear it) or if the user clears app data.

---

## 1. Read cache: opening the app offline

**Problem:** with no network every `GET` fails, so the app would show "No internet".

**Idea:** every time a read request succeeds, save its response body. When a request fails
because there is no network, answer it from the saved copy as if the server had replied.

### Which requests are cached

Only `GET`s to a fixed list of paths (`CACHEABLE_PATHS` in `offlineCache.ts`):

```
/api/user/init, /api/user/me, /api/student/enrollment/subjects,
/api/student/enrollment/sleep-duration, /api/timetable, /api/lab-timetable,
/api/tutorial-timetable, /api/time-slots, /api/attendance, /api/attendance/lab-tutorial, /api/polls
```

The cache key is the **full URL including the query**, so `/api/attendance?date=2026-11-10` and
`?date=2026-11-11` are separate entries. At most `MAX_ENTRIES = 40` are kept; the oldest are
dropped first.

### The code path (`authenticatedFetch` in `src/lib/api.ts`)

```ts
if (!isCacheable(url, options.method)) return fetch(url, ...);   // POST/DELETE etc: no cache

try {
  const response = await fetch(url, ...);
  if (response.ok) {
    // copy the body into the cache in the background
    response.clone().text().then(body => saveToOfflineCache(url, body));
  }
  return response;
} catch (error) {                       // fetch throws TypeError when there is no network
  const cached = offlineResponse(url);  // a fake Response built from the saved body
  if (cached) return cached;
  throw error;
}
```

`offlineResponse()` returns `new Response(savedBody, { status: 200, headers: { "X-Offline-Cache": savedAt } })`.
Callers don't know the difference, which is the point: no screen needed changing. A screen that
wants to say "showing saved data" can check the `X-Offline-Cache` header.

**Bonus use:** `readCachedJson(url)` lets the app draw the first screen instantly from the cache
on every launch, then refresh from the network (that's why the timetable and polls appear on
first paint). `hasOfflineSnapshot()` is true once `/api/user/init` is cached, which is how
`App.tsx` decides it can skip the loading screen.

---

## 2. Write queue: storing marks that couldn't be sent

`src/lib/offlineQueue.ts` is a tiny persistent list. Each entry:

```ts
interface QueuedMark {
  slotKey: string;        // which class: "2026-11-10-3-slot2" (date-subjectId-slotN)
  date: string;           // "2026-11-10"
  subjectId: string;
  kind: "mark" | "delete";// mark = POST /api/attendance, delete = DELETE /api/attendance/{id}
  status?: "present" | "absent" | "cancelled";
  serverStatus?: ...;     // what the SERVER had for this class before any offline change
  body?: {...};           // the exact JSON to POST later
  attendanceId?: number;  // for deletes
  queuedAt: number;       // Date.now() when queued
}
```

### Rules

* **One entry per class.** `enqueueMark()` first removes any entry with the same `slotKey`,
  then appends. Tap Present, then Absent, offline → only "Absent" is sent. This avoids sending
  a chain of changes and keeps the queue small.
* **`serverStatus` is remembered from the first offline change.** If the server had "present"
  and the student taps absent, then cancelled, `serverStatus` stays "present". It's needed to
  adjust the percentages correctly (see 3c).
* **`dequeueMark(slotKey, queuedAt)`** removes an entry only if it's still the *same* entry.
  If the student tapped again while a sync was running, the newer tap isn't thrown away.
* Every write fires a window event `attendance-offline-queue-changed`. `subscribeQueue()`
  listens to it and drives the count shown in the **"Offline · N marks to sync"** pill
  (`src/components/offline/OfflineStatusPill.tsx`).
* `isNetworkError(e)` = `e instanceof TypeError || navigator.onLine === false`. `fetch` throws a
  `TypeError` only when the request never reached a server. A 4xx/5xx is a *response*, not an
  error, so it never ends up queued by mistake.

---

## 3. Marking and syncing (`AttendanceContext.tsx`)

### 3a. Marking a class: `markAttendance(...)`

1. Build the `slotKey` for the class (lecture: `date-subjectId-slotN`; lab or custom time:
   `date-subjectId-HH:mm-HH:mm`; extra class: `date-subjectId-extra-N`).
2. **Optimistic update first.** `setTodayAttendance` shows the new status and
   `updateStatsLocally` adjusts the subject's present/absent counts before any request. The
   button reacts instantly, online or not.
3. Build `requestBody` (`subjectId`, `lectureDate`, `status`, plus `timeSlot` or
   `startTime/endTime`, plus extra-class flags).
4. `if (!navigator.onLine) throw new TypeError('offline')`, so the app doesn't wait for a
   timeout when the phone already knows it's offline.
5. `POST /api/attendance`.
   * **OK** → remove any older queued entry for this class (the server now has the newest
     state), store the returned `attendanceId` (needed to unmark later), refresh stats.
   * **Server said no (4xx/5xx)** → undo the optimistic change and show an error toast.
   * **Network error** → `enqueueMark({ kind: 'mark', status, body: requestBody, serverStatus })`.
     The optimistic change **stays** on screen and no error toast is shown; the pill says it
     will sync.

**Unmarking** (tapping the same status again) works the same way:

* If the mark only ever existed in the queue (never reached the server): just `dequeueMark`.
* If the server has it: `DELETE /api/attendance/{attendanceId}`; on a network error, queue
  `{ kind: 'delete', attendanceId }`.

### 3b. Showing queued marks after a refresh: the "overlay"

The server (or its cached copy) doesn't know about queued marks, so a refresh would make them
disappear. Two functions lay the queue back on top of whatever the server returned:

* `overlayQueuedStatuses(date, attendanceMap)`: for every queued entry on that date, set
  (or remove, for deletes) the class's status.
* `overlayQueuedStats(date, statsMap)`: for every queued entry up to that date, adjust the
  subject's counts with `calculateNewStats(stats, item.serverStatus, newStatus)`.

They run inside `fetchAttendanceData` and `fetchTodayStats` right after the server data
arrives, so every screen sees the queued marks too.

### 3c. Why `serverStatus` matters

`calculateNewStats(current, previous, next)` moves one count from `previous` to `next`
(present → absent: present − 1, absent + 1). The overlay must start from what the **server**
counted, not from the last tap, or a class changed twice offline would be counted twice.

### 3d. Sending the queue: `syncQueuedMarks()`

```
if not signed in, or already syncing (isSyncingRef), or navigator.onLine is false → stop
for each entry, oldest first:
    mark   → POST /api/attendance with entry.body
    delete → DELETE /api/attendance/{attendanceId}
    fetch threw (still no network)  → stop, try again later
    2xx (or 404 for a delete)        → dequeue it, synced++
    401 or 5xx                       → stop, keep the rest (signed out / server trouble)
    any other 4xx                    → dequeue it, rejected++ (retrying can't help)
afterwards: toast if any were rejected; if anything changed, refetch attendance and stats
```

It's sequential on purpose: entries depend on order (a delete after a mark of the same class).
`isSyncingRef` prevents two syncs running at once and sending something twice.

### 3e. When sync runs

In a `useEffect` that runs once the student is known:

* immediately (app start),
* on the browser `online` event (`window.addEventListener('online', syncQueuedMarks)`),
* when the app returns to the foreground (`App.addListener('appStateChange', ...)` from
  `@capacitor/app`), through `catchUpOutsideMarks`, which also syncs.

---

## 4. Marks made outside the app (native hand-off)

The after-class notification's Present / Absent / Cancelled buttons are handled by Java
(`ClassCheckReceiver` → `ClassCheck.mark`), because the WebView isn't running then.

1. `ClassCheck.mark` sends `POST {apiBase}/api/attendance` with `HttpURLConnection`, using the
   token and API URL the app stored in `SharedPreferences` (`WidgetBridge.update` saves them).
2. Whatever happens, it records the mark in a **hand-off list** (`SharedPreferences` key
   `native_marks`) with `sent: true/false` and the exact `body` it posted.
3. Next time the app opens or comes to the foreground, `catchUpOutsideMarks()` calls
   `takeNativeMarks()`, which returns the list and empties it:
   * `sent: true` → the server has it; just refresh.
   * `sent: false` (no network or a 5xx) → put it into the normal JS queue with `enqueueMark`,
     then `syncQueuedMarks()` sends it like any other offline mark.

So there is still **one** queue that sends things; the native side only hands marks over.

---

## How to do it yourself

### Make another endpoint readable offline
Add its path to `CACHEABLE_PATHS` in `src/lib/offlineCache.ts`. That's all: any
`authenticatedFetch` GET to it is cached and served offline from then on. If it takes a query
string, remember each distinct URL is its own entry (40 max).

### Make another action work offline (e.g. creating a poll vote)
1. Add a new `kind` to `QueuedMark` (e.g. `"vote"`) with the fields needed to replay it.
2. Where the action happens: apply the change to the UI first (optimistic), then `try` the
   request; in `catch`, `if (isNetworkError(e)) enqueueMark({...})`, else undo and show an error.
   Pick a unique key per thing being changed so repeated taps replace each other.
3. In `syncQueuedMarks`, add a branch that replays your `kind` (method, URL, body).
4. If a refresh would hide it, add an overlay like `overlayQueuedStatuses` for your data.

### Test it
* **Browser:** Chrome DevTools → Network → set throttling to **Offline**, mark a class, reload
  the page (the mark stays, the pill shows "1 mark to sync"), switch back to **No throttling**.
  The `online` event fires and the mark is sent (watch the `POST /api/attendance`).
* **Inspect the queue:** DevTools console: `JSON.parse(localStorage.attendance_io_offline_queue_v1)`.
* **Phone:** turn on airplane mode, mark, close the app, turn airplane mode off, open the app.
  For a debug build, `chrome://inspect` on your computer shows the WebView's console and storage.

### Things to keep true if you change it
* Only queue on **network errors**. A server "no" must never be retried forever.
* Keep **one entry per thing** (replace, don't append), and remember the server's original
  value if you show adjusted totals.
* Clear both stores on logout (`clearQueue()` and `clearOfflineCache()` are already called
  there), or the next person to sign in would see or send the previous student's data.
