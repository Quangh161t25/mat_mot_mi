// Notification & Device Alert Utilities for Mắt Một Mí Media

export interface DeviceNotificationPayload {
  title: string;
  body: string;
  url?: string;
}

let sharedAudioCtx: AudioContext | null = null;

// Initialize & unlock AudioContext on user interaction (Required for iOS & Android)
export function unlockAudioContext() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch (e) {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'click', 'keydown'];
  const handleInteraction = () => {
    unlockAudioContext();
    unlockEvents.forEach(evt => window.removeEventListener(evt, handleInteraction));
  };
  unlockEvents.forEach(evt => window.addEventListener(evt, handleInteraction, { passive: true, once: true }));
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
  if (typeof window === 'undefined') {
    return 'denied';
  }

  unlockAudioContext();

  if (!('Notification' in window)) {
    // If on iOS Safari without PWA installation, inform user
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

// 3. Play crisp notification chime via Web Audio API (Loud & clear for studio environment)
export function playNotificationSound() {
  if (typeof window === 'undefined') return;

  try {
    unlockAudioContext();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = sharedAudioCtx || new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First note (A5 - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second note (C#6 - 1108.7Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108.73, now + 0.1);
    gain2.gain.setValueAtTime(0.35, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);

    // Third note (E6 - 1318.5Hz - Distinctive High Chime)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.51, now + 0.22);
    gain3.gain.setValueAtTime(0.4, now + 0.22);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.22);
    osc3.stop(now + 0.65);
  } catch (e) {
    // Audio context policy
  }
}

// 4. Trigger system push / device notification (Vibrate + Sound + Native Popup)
export async function triggerDeviceNotification(payload: DeviceNotificationPayload) {
  // 1. Luôn phát chuông thông báo
  playNotificationSound();

  // 2. Rung điện thoại (Pattern: Rung 300ms - Nghỉ 150ms - Rung 300ms)
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 150, 300]);
    } catch (e) {
      // ignore
    }
  }

  // 3. Hiển thị thông báo hệ thống nếu có quyền
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  // Ưu tiên hiển thị qua Service Worker (Dạng Banner thông báo của điện thoại)
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [300, 150, 300],
          tag: 'mmm-equipment-alert',
          renotify: true,
          data: { url: payload.url || '/transfers' },
        } as NotificationOptions);
        return;
      }
    }

    // Fallback cho trình duyệt thông thường
    new Notification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
    });
  } catch (err) {
    console.warn('Lỗi hiển thị thông báo thiết bị:', err);
  }
}
