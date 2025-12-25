
import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-info-view',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:pwa-can-install)': 'onCanInstall()',
    '(window:pwa-installed-success)': 'onInstalled()',
  },
  template: `
    <!-- Đổi justify-center thành justify-start và pt-10 thành pt-2 để đẩy nội dung lên cao -->
    <div class="flex flex-col items-center justify-start px-8 pt-2 pb-10 text-center animate-fade-in min-h-full relative">
      
      @if (toastMsg()) {
        <div class="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-bounce-in w-max max-w-[90vw]">
          <div class="bg-slate-800 px-6 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-white/20 backdrop-blur-md">
            <span class="material-icons-round text-white text-sm">info_outline</span>
            <span class="text-[10px] font-black uppercase tracking-wider text-white">{{ toastMsg() }}</span>
          </div>
        </div>
      }

      <!-- Logo Section -->
      <div class="relative w-28 h-28 mb-4 mt-4">
        <!-- Glow effect -->
        <div class="absolute inset-0 bg-rose-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
        <img src="assets/logo.svg" 
             class="w-full h-full object-contain drop-shadow-xl animate-float relative z-10" 
             alt="Hoa Sen Logo">
      </div>

      <!-- Header Title Section - Removed Slogan as requested -->
      <div class="space-y-1.5 mb-8">
        <h2 class="text-xl font-black text-slate-800 tracking-[0.25em] uppercase">Mầm Non Hoa Sen</h2>
      </div>

      <div class="w-full max-w-sm space-y-4">
        <!-- Developer Info Card - Changed style to glass-nav to be transparent and blurred like menu -->
        <div class="glass-nav rounded-[40px] p-8 border-white/25 shadow-lg">
          <span class="text-[8px] font-black uppercase tracking-[0.3em] text-rose-400 mb-3 block">Người thực hiện</span>
          <h3 class="text-xl font-black text-slate-800 mb-4">Võ Văn Cảnh</h3>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-center gap-1.5 px-5 py-2 bg-white/60 rounded-full border border-slate-100">
              <span class="material-icons-round text-[16px] text-rose-500">location_on</span>
              <span class="text-[10px] font-bold text-slate-600 uppercase">Sơn Tịnh, Quảng Ngãi</span>
            </div>
            <a href="tel:0868474194" class="flex items-center justify-center gap-1.5 px-5 py-2 bg-rose-50/50 rounded-full border border-rose-100 active:scale-95 transition-transform">
              <span class="material-icons-round text-[16px] text-rose-500">phone_iphone</span>
              <span class="text-[10px] font-black text-rose-600 tracking-widest">0868.474.194</span>
            </a>
          </div>
        </div>

        <!-- Version and Update Buttons with requested shadows -->
        <div class="grid grid-cols-2 gap-3">
          <div class="glass-card rounded-3xl p-4 flex flex-col items-center justify-center border-white shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
            <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Phiên bản</span>
            <span class="text-xs font-bold text-slate-700">{{ currentVersion }}</span>
          </div>
          
          <button (click)="checkUpdate()" class="glass-card rounded-3xl p-4 flex flex-col items-center justify-center border-white active:scale-95 bg-emerald-50/50 shadow-[0_10px_25px_rgba(16,185,129,0.12)] transition-shadow">
            <span class="text-[8px] font-black uppercase text-emerald-600 mb-1">Cập nhật</span>
            <span class="material-icons-round text-emerald-600 text-base">sync</span>
          </button>
        </div>

        <!-- Installation Button -->
        <button (click)="handleInstall()" 
                [disabled]="store.isInstalled() || !store.canInstallNow()"
                [class]="store.isInstalled() 
                    ? 'bg-slate-100 text-slate-300 border-transparent grayscale' 
                    : store.canInstallNow() 
                        ? 'from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-200 active:scale-95 animate-pulse-gentle'
                        : 'bg-slate-100 text-slate-300 border-transparent grayscale'"
                class="w-full bg-gradient-to-r py-5 rounded-[28px] flex items-center justify-center gap-3 border border-white/20 transition-all">
          
          <span class="material-icons-round">
            @if (store.isInstalled()) {
              check_circle
            } @else if (store.canInstallNow()) {
              install_mobile
            } @else {
              mobile_off
            }
          </span>
          <div class="flex flex-col items-start text-left">
            <span class="text-[14px] font-black uppercase tracking-wider leading-none">
              @if (store.isInstalled()) {
                Đã cài ứng dụng
              } @else if (store.canInstallNow()) {
                Cài đặt ngay
              } @else {
                Không thể cài đặt
              }
            </span>
            <span class="text-[9px] opacity-80 font-bold uppercase tracking-tight">
              @if (store.isInstalled()) {
                Trải nghiệm mượt mà
              } @else if (store.canInstallNow()) {
                Bấm để cài lên thiết bị
              } @else {
                Trình duyệt không hỗ trợ
              }
            </span>
          </div>
        </button>
      </div>

      <div class="mt-12 opacity-5"><span class="material-icons-round text-slate-500 text-xs">spa</span></div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-bounce-in { animation: bounceIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-pulse-gentle { animation: pulseGentle 3s ease-in-out infinite; }
    .animate-float { animation: float 6s ease-in-out infinite; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bounceIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
    @keyframes pulseGentle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  `]
})
export class InfoViewComponent implements OnInit {
  store = inject(StoreService);
  toastMsg = signal<string>('');
  readonly currentVersion = '1.0.27';

  ngOnInit() {
    this.store.checkPwaStatus();
  }

  onCanInstall() {
    this.store.canInstallNow.set(true);
  }

  onInstalled() {
    this.store.isInstalled.set(true);
    this.showToast('Đã cài đặt thành công!');
  }

  async handleInstall() {
    if (this.store.isInstalled()) {
      this.showToast('Ứng dụng đã được cài đặt');
      return;
    }
    
    if (!this.store.canInstallNow()) {
        if (this.isIOS()) {
            this.showToast('Chọn Chia sẻ > Thêm vào MH chính');
        } else {
            this.showToast('Không thể cài đặt trên trình duyệt này');
        }
        return;
    }

    const promptEvent = (window as any).deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredPrompt = null;
        this.store.canInstallNow.set(false);
      }
    } else {
      this.showToast('Trình duyệt chưa sẵn sàng cài đặt');
    }
  }

  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  async checkUpdate() {
    this.showToast('Đang kiểm tra cập nhật...');

    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      this.showToast('Không thể cập nhật lúc này.');
      return;
    }

    try {
      const res = await fetch('assets/version.json?t=' + Date.now());
      if (!res.ok) throw new Error('Network response was not ok.');
      
      const serverInfo = await res.json();
      const latestVersion = serverInfo.version;

      if (this.isNewerVersion(latestVersion, this.currentVersion)) {
        this.showToast(`Phát hiện bản mới ${latestVersion}!`);
        
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              this.showToast('Đang tải xuống bản cập nhật...');
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  this.showToast('Đã tải xong! Khởi động lại app để cập nhật.');
                }
              });
            }
          });
        }
      } else {
        this.showToast(`Bản ${this.currentVersion} là mới nhất.`);
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra cập nhật:', error);
      this.showToast('Lỗi! Không thể kiểm tra cập nhật.');
    }
  }

  private isNewerVersion(newVersion: string, oldVersion: string): boolean {
    if (!newVersion || !oldVersion) return false;
    const newParts = newVersion.split('.').map(Number);
    const oldParts = oldVersion.split('.').map(Number);
    for (let i = 0; i < newParts.length; i++) {
      const newPart = newParts[i];
      const oldPart = oldParts[i] || 0;
      if (newPart > oldPart) return true;
      if (newPart < oldPart) return false;
    }
    return false;
  }

  private showToast(msg: string) {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(''), 4000);
  }
}