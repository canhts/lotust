
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceViewComponent } from './components/attendance-view.component';
import { StudentManagerComponent } from './components/student-manager.component';
import { HistoryViewComponent } from './components/history-view.component';
import { InfoViewComponent } from './components/info-view.component';
import { StoreService } from './services/store.service';

type AppTab = 'attendance' | 'students' | 'history' | 'info';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, 
    AttendanceViewComponent, 
    StudentManagerComponent, 
    HistoryViewComponent,
    InfoViewComponent
  ],
  template: `
    <div class="h-full w-full flex flex-col relative overflow-hidden">
      
      <!-- Top Header - Full Width Menu -->
      <header class="fixed top-4 left-0 right-0 px-4 z-[110]">
        
        <!-- Navigation Menu (Full Width stretched) -->
        <div class="w-full glass-nav rounded-full p-1 flex items-center justify-around shadow-lg border-white/40 h-14">
          <button (click)="trySetTab('attendance')"
            class="relative flex-1 h-12 flex items-center justify-center rounded-full transition-all duration-300">
            <div [class]="store.currentTab() === 'attendance' ? 'bg-white/45 border border-white/50 scale-100 shadow-sm' : 'scale-0 opacity-0'" 
                 class="absolute inset-0 rounded-full transition-all duration-300"></div>
            <span class="material-icons-round text-xl relative z-10"
                  [class]="store.currentTab() === 'attendance' ? 'text-slate-800' : 'text-slate-400/60'">how_to_reg</span>
          </button>

          <button (click)="trySetTab('history')"
            class="relative flex-1 h-12 flex items-center justify-center rounded-full transition-all duration-300">
             <div [class]="store.currentTab() === 'history' ? 'bg-white/45 border border-white/50 scale-100 shadow-sm' : 'scale-0 opacity-0'" 
                 class="absolute inset-0 rounded-full transition-all duration-300"></div>
            <span class="material-icons-round text-xl relative z-10"
                  [class]="store.currentTab() === 'history' ? 'text-slate-800' : 'text-slate-400/60'">history</span>
          </button>

          <button (click)="trySetTab('students')"
            class="relative flex-1 h-12 flex items-center justify-center rounded-full transition-all duration-300">
             <div [class]="store.currentTab() === 'students' ? 'bg-white/45 border border-white/50 scale-100 shadow-sm' : 'scale-0 opacity-0'" 
                 class="absolute inset-0 rounded-full transition-all duration-300"></div>
            <span class="material-icons-round text-xl relative z-10"
                  [class]="store.currentTab() === 'students' ? 'text-slate-800' : 'text-slate-400/60'">person_add</span>
          </button>

          <button (click)="trySetTab('info')"
            class="relative flex-1 h-12 flex items-center justify-center rounded-full transition-all duration-300">
             <div [class]="store.currentTab() === 'info' ? 'bg-white/45 border border-white/50 scale-100 shadow-sm' : 'scale-0 opacity-0'" 
                 class="absolute inset-0 rounded-full transition-all duration-300"></div>
            <span class="material-icons-round text-xl relative z-10"
                  [class]="store.currentTab() === 'info' ? 'text-slate-800' : 'text-slate-400/60'">info</span>
          </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <!-- Adjusted pt-24 to pt-[72px] (Exact touch: top 16px + height 56px = 72px) -->
      <main class="flex-1 overflow-y-auto no-scrollbar relative z-10 h-full transition-all duration-500 pt-[72px]">
        @switch (store.currentTab()) {
          @case ('attendance') { <app-attendance-view class="block animate-fade-in pb-12"/> }
          @case ('history') { <app-history-view class="block animate-fade-in pb-12"/> }
          @case ('students') { <app-student-manager class="block animate-fade-in pb-12"/> }
          @case ('info') { <app-info-view class="block animate-fade-in pb-12"/> }
        }
      </main>

      <!-- Confirmation Popup -->
      @if (store.isConfirmingExit()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center p-8">
          <div class="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" (click)="store.cancelExit()"></div>
          <div class="bg-white/70 backdrop-blur-md rounded-[32px] p-7 w-full max-w-[280px] shadow-2xl relative z-10 animate-popup border border-white/50">
            <div class="w-12 h-12 bg-amber-50/50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <span class="material-icons-round text-amber-500 text-2xl">warning_amber</span>
            </div>
            <h3 class="text-sm font-black text-slate-800 mb-2 text-center uppercase tracking-tight leading-tight">
              Chưa lưu thay đổi?
            </h3>
            <p class="text-slate-400 text-[10px] mb-6 text-center px-2 font-medium leading-relaxed">
              Dữ liệu điểm danh vừa chỉnh sửa chưa được lưu. Nếu rời đi ngay, các thay đổi sẽ bị mất.
            </p>
            <div class="flex flex-col gap-2">
              <button (click)="store.cancelExit()" 
                      class="w-full py-3 rounded-xl bg-slate-800 font-black text-[9px] text-white tracking-[0.2em] uppercase shadow-lg active:scale-95 transition-all">
                Ở LẠI ĐỂ LƯU
              </button>
              <button (click)="store.confirmExit()" 
                      class="w-full py-3 rounded-xl bg-white/30 font-black text-[9px] text-slate-400 tracking-[0.2em] uppercase active:scale-95 transition-all border border-slate-100">
                BỎ QUA THAY ĐỔI
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-popup { animation: popup 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes popup { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  store = inject(StoreService);

  trySetTab(tab: AppTab) {
    if (tab === this.store.currentTab()) return;
    this.store.requestSafeAction(() => this.store.currentTab.set(tab));
  }
}