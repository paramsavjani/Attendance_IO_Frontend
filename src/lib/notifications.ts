import { Capacitor } from '@capacitor/core';
import { API_CONFIG, authenticatedFetch } from './api';

/**
 * Check notification permission status without requesting
 * Returns 'granted', 'denied', or 'prompt'
 */
export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'prompt' | null> {
  if (!Capacitor.isNativePlatform()) {
    // On web, we don't need to block - notifications are optional
    return 'granted';
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const permStatus = await PushNotifications.checkPermissions();
    return permStatus.receive as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    console.error('[FCM] Error checking notification permission:', error);
    return null;
  }
}

/**
 * Request notification permissions and register for push notifications
 * Returns the FCM token if successful, null otherwise
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[FCM] Push notifications only work on native platforms');
    return null;
  }

  try {
    console.log('[FCM] Starting notification permission request...');
    // Dynamically import to avoid bundling issues
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();
    console.log('[FCM] Current permission status:', permStatus);
    
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
      console.log('[FCM] Permission request result:', permStatus);
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[FCM] Notification permission denied. Status:', permStatus.receive);
      return null;
    }

    console.log('[FCM] Permission granted, setting up listeners BEFORE register()...');

    // IMPORTANT: Set up listeners BEFORE calling register()
    // The registration event can fire immediately, so listeners must be ready
    return new Promise((resolve) => {
      let resolved = false;
      let timeoutId: NodeJS.Timeout;

      // Listen for registration - MUST be set up before register()
      const registrationListener = PushNotifications.addListener('registration', (token) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        console.log('[FCM] ✅ Push registration success, token:', token.value?.substring(0, 20) + '...');
        resolve(token.value);
      });

      // Listen for registration errors
      const errorListener = PushNotifications.addListener('registrationError', (error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        console.error('[FCM] ❌ Error on registration:', error);
        resolve(null);
      });

      // Set a timeout in case registration takes too long
      timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        console.warn('[FCM] ⏱️ Push notification registration timeout after 15 seconds');
        registrationListener.remove();
        errorListener.remove();
        resolve(null);
      }, 15000);

      // NOW call register() after listeners are set up
      console.log('[FCM] Calling PushNotifications.register()...');
      PushNotifications.register()
        .then(() => {
          console.log('[FCM] Register() call completed, waiting for token...');
        })
        .catch((error) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutId);
          console.error('[FCM] ❌ Error during register() call:', error);
          registrationListener.remove();
          errorListener.remove();
          resolve(null);
        });
    });
  } catch (error) {
    console.error('[FCM] ❌ Exception in requestNotificationPermission:', error);
    return null;
  }
}

/**
 * Send FCM token to backend
 */
export async function sendFcmTokenToBackend(token: string | null): Promise<boolean> {
  try {
    console.log('[FCM] 📤 Sending FCM token to backend...');
    console.log('[FCM] Token:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('[FCM] Endpoint:', API_CONFIG.ENDPOINTS.UPDATE_FCM_TOKEN);
    
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.UPDATE_FCM_TOKEN, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ fcmToken: token }),
    });

    console.log('[FCM] Response status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log('[FCM] ✅ FCM token updated successfully:', data);
      return true;
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[FCM] ❌ Failed to update FCM token. Status:', response.status);
      console.error('[FCM] Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('[FCM] ❌ Exception sending FCM token to backend:', error);
    if (error instanceof Error) {
      console.error('[FCM] Error message:', error.message);
      console.error('[FCM] Error stack:', error.stack);
    }
    return false;
  }
}

/**
 * Initialize push notifications and register token
 * Call this after user logs in
 */
export async function initializePushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[FCM] Not on native platform, skipping initialization');
    return;
  }

  try {
    console.log('[FCM] 🚀 Initializing push notifications...');
    // Dynamically import to avoid bundling issues
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    // Request permission and get token
    console.log('[FCM] Requesting notification permission...');
    const token = await requestNotificationPermission();
    
    if (token) {
      console.log('[FCM] ✅ Got FCM token, sending to backend...');
      // Send token to backend
      const success = await sendFcmTokenToBackend(token);
      if (success) {
        console.log('[FCM] ✅✅✅ FCM token successfully sent and saved!');
      } else {
        console.error('[FCM] ❌ Failed to send FCM token to backend');
      }

      // Set up notification listeners
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[FCM] 📬 Push notification received:', notification);
        // You can show a toast or update UI here
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('[FCM] 👆 Push notification action performed:', notification);
        // Handle notification tap action
      });
    } else {
      console.warn('[FCM] ⚠️ No FCM token received, cannot send to backend');
    }
  } catch (error) {
    console.error('[FCM] ❌ Exception in initializePushNotifications:', error);
    if (error instanceof Error) {
      console.error('[FCM] Error message:', error.message);
      console.error('[FCM] Error stack:', error.stack);
    }
  }
}

/**
 * Clear FCM token on logout
 */
export async function clearFcmToken(): Promise<void> {
  try {
    await sendFcmTokenToBackend(null);
  } catch (error) {
    console.error('Error clearing FCM token:', error);
  }
}

