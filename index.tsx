
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './src/app.component';

// Quản lý sự kiện cài đặt PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-can-install'));
});

window.addEventListener('appinstalled', () => {
  (window as any).deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed-success'));
});

// Đăng ký Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

    if (isSecure) {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => console.log('Hoa Sen PWA: SW Registered'))
        .catch(err => console.warn('Hoa Sen PWA: SW Fail', err));
    }
  });
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection()
  ]
})
.then(() => {
  // Khi Angular đã khởi động xong, gọi hàm kết thúc loading ở index.html
  if ((window as any).finishSplashLoading) {
    (window as any).finishSplashLoading();
  } else {
    // Fallback nếu script ở index.html chưa chạy hoặc lỗi
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 600);
    }
  }
})
.catch(err => {
  console.error('CRITICAL: Lỗi khởi động Angular:', err);
  // Vẫn tắt splash để hiện lỗi (nếu có)
  if ((window as any).finishSplashLoading) {
    (window as any).finishSplashLoading();
  }
});

// AI Studio always uses an `index.tsx` file for all project types.
