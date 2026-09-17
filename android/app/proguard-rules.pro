# ---- Capacitor / WebView bridge -------------------------------------------
# Capacitor discovers plugins and their @PluginMethod handlers via reflection,
# and exposes the bridge to JS through @JavascriptInterface. Keep all of it.
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.NativePlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class org.apache.cordova.** { *; }

# App entry point
-keep class com.attendanceio.app.** { *; }

# ---- Firebase / Google Play services --------------------------------------
# These ship their own consumer rules; this just guards the messaging service.
-keep class com.google.firebase.messaging.** { *; }

# ---- Crash readability -----------------------------------------------------
# Keep line numbers so Play Console / Crashlytics stack traces stay useful,
# but hide the original source file name.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
