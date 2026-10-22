// Notification & Device Alert Utilities for Mắt Một Mí Media

export interface DeviceNotificationPayload {
  title: string;
  body: string;
  url?: string;
}

// 1. Register Service Worker for PWA & Background Push
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.warn('Lỗi đăng ký Service Worker:', error);
    return null;
  }
}

// 2. Request Notification Permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Lỗi xin quyền thông báo:', error);
    return 'denied';
  }
}

// 3. Play soft notification chime via Web Audio API (No external sound files required)
export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (E6 - 1318.5 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (G#6 - 1661.2 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1661.22, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    // Audio context may be blocked by autoplay policies until user gesture
  }
}

// 4. Trigger system push / device notification
export async function triggerDeviceNotification(payload: DeviceNotificationPayload) {
  // Always play notification chime
  playNotificationSound();

  // Trigger vibration if supported on phone
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {
      // ignore
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  // Try via ServiceWorker first (Native push style)
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: { url: payload.url || '/transfers' },
        } as NotificationOptions);
        return;
      }
    }

    // Fallback to standard Notification
    new Notification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
    });
  } catch (err) {
    console.warn('Lỗi hiển thị thông báo thiết bị:', err);
  }
}
