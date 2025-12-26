
import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, AttendanceEntry } from '../services/store.service';

@Component({
  selector: 'app-attendance-view',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col text-slate-800 pb-36">
      
      <!-- Integrated Control Card - Floating Sticky Island -->
      <!-- Compact design, shared glass background, transparent inner rows -->
      <!-- Reduced top padding to pt-1 for tighter fit with menu -->
      <div class="sticky top-0 z-50 px-3 pt-1 pb-1">
        <!-- Removed backdrop-blur-xl to match menu's native glass-nav blur -->
        <!-- Updated border to border-white/40 to match menu -->
        <!-- Updated shadow to shadow-lg to match menu depth -->
        <div class="glass-nav rounded-[26px] px-3 py-3 shadow-lg border-white/40 flex flex-col gap-2.5">
          
          <!-- Row 1: Date Selector (Compact) -->
          <div class="flex items-center justify-center gap-2 relative h-8">
            <button (click)="tryJumpDate(1)" [disabled]="!canGoPrev()" 
                    [class.opacity-10]="!canGoPrev()" 
                    class="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 active:scale-90 transition-transform hover:bg-white/10">
              <span class="material-icons-round text-sm">arrow_back_ios_new</span>
            </button>
            
            <div class="min-w-[100px] text-center">
              <span class="font-black text-[12px] text-slate-900 tracking-[0.2em] uppercase leading-none block drop-shadow-sm">
                {{ displayDate() }}
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button (click)="tryJumpDate(-1)" [disabled]="!canGoNext()" 
                      [class.opacity-10]="!canGoNext()" 
                      class="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 active:scale-90 transition-transform hover:bg-white/10">
                <span class="material-icons-round text-sm">arrow_forward_ios</span>
              </button>

              @if (!isToday()) {
                <button (click)="tryGoToday()" 
                        class="w-7 h-7 bg-white/30 border border-white/50 text-emerald-700 rounded-full flex items-center justify-center shadow-sm active:scale-90 animate-fade-in-right ml-1">
                  <span class="material-icons-round text-base">event_repeat</span>
                </button>
              }
            </div>
          </div>

          <!-- Row 2: Global Stats (Numbers Only - No Text/Icons) -->
          <!-- NOW USES globalStats() which tracks SAVED data only -->
          <div class="flex items-center justify-center gap-8 h-7">
            <div class="flex items-center gap-1.5" title="Hiện diện">
              <span class="text-[20px] font-black text-emerald-700 leading-none drop-shadow-sm">{{ globalStats().totalPresent ?? '-' }}</span>
            </div>
            
            <div class="w-[1px] h-4 bg-slate-400/20"></div>

            <div class="flex items-center gap-1.5" title="Vắng mặt">
              <span class="text-[20px] font-black text-rose-600 leading-none drop-shadow-sm">{{ globalStats().totalAbsent ?? '-' }}</span>
            </div>

            <div class="w-[1px] h-4 bg-slate-400/20"></div>

            <div class="flex items-center gap-1.5" title="Tổng">
              <span class="text-[20px] font-black text-slate-700 leading-none drop-shadow-sm">{{ globalStats().totalStudents ?? '-' }}</span>
            </div>
          </div>

          <!-- Row 3: Class Tabs with Individual Stats -->
          <div class="grid grid-cols-4 gap-2">
            @for (cls of store.classes; track cls.id) {
              @let stats = allClassesSavedStats()[cls.id];
              <button 
                (click)="selectedClass.set(cls.id)"
                [class]="selectedClass() === cls.id ? 'bg-white/45 border-white/50 shadow-md scale-105' : 'bg-white/10 border-transparent'"
                class="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-2 transition-all duration-200 border active:scale-95">
                
                <span 
                  [class]="selectedClass() === cls.id ? cls.activeTextColor : 'text-slate-400'"
                  class="text-[9px] font-black uppercase tracking-widest transition-colors">
                  {{ cls.name }}
                </span>
                
                <div class="flex items-baseline gap-1 font-bold">
                  <span class="text-emerald-700 font-black text-sm leading-none">{{ stats.present ?? '-' }}</span>
                  <span class="text-slate-400 font-medium text-xs leading-none">/</span>
                  <span class="text-slate-600 text-sm leading-none">{{ stats.total ?? '-' }}</span>
                </div>
              </button>
            }
          </div>

          <!-- Row 4: Select All Button -->
          @if (studentsInClass().length > 0) {
            <div class="flex items-center justify-center pt-2">
                <button (click)="toggleAll()" 
                        [class]="allPresent() ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-200' : 'bg-white/20 text-slate-500 border-white/20'"
                        class="px-5 py-2 rounded-full flex items-center justify-center gap-2 border transition-all active:scale-90 shadow-sm backdrop-blur-sm text-[9px] font-black uppercase tracking-widest">
                    <span class="material-icons-round text-sm">done_all</span>
                    <span>{{ allPresent() ? 'Bỏ chọn tất cả' : 'Chọn tất cả' }}</span>
                </button>
            </div>
          }
        </div>
      </div>

      <!-- Students List Area -->
      <div class="px-5 space-y-2.5 pt-1">
        @if (studentsInClass().length === 0) {
          <div class="flex flex-col items-center justify-center h-40 text-slate-300 opacity-20">
            <span class="material-icons-round text-3xl mb-2">school</span>
            <p class="text-[9px] font-bold uppercase tracking-widest">Danh sách trống</p>
          </div>
        } @else {
          @for (student of studentsInClass(); track student.id) {
            <div (click)="toggleStudent(student.id)" 
                  [class]="presentStudentIds().has(student.id) ? 'bg-white/70 border-white shadow-md' : 'bg-white/20 border-transparent'" 
                  class="py-3.5 px-5 rounded-2xl flex items-center justify-between transition-all duration-150 active:scale-[0.98] cursor-pointer border backdrop-blur-[4px]">
              <div class="flex flex-col">
                <h3 [class]="presentStudentIds().has(student.id) ? 'text-slate-900' : 'text-slate-700'" 
                    class="font-bold text-[14px] tracking-tight">{{ student.name }}</h3>
                @if (!isToday() && isRetired(student.id)) {
                  <span class="text-[7px] text-rose-500 font-bold uppercase tracking-tighter italic">Đã nghỉ học</span>
                }
              </div>
              <div [class]="presentStudentIds().has(student.id) ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-200/50' : 'bg-white/30 border-white/20'" 
                    class="w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300">
                @if (presentStudentIds().has(student.id)) {
                  <span class="material-icons-round text-white text-[11px] font-black">check</span>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Floating Action Button -->
      @if (hasChanges()) {
        <button (click)="saveAttendance()" 
                class="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 glass-nav bg-white/60 text-slate-800 rounded-full flex items-center justify-center shadow-2xl border-white/60 active:scale-90 transition-all z-[100] animate-bounce-subtle backdrop-blur-md">
          <span class="material-icons-round text-2xl">save</span>
        </button>
      }

      <!-- Toast Notification -->
      @if (showToast()) {
        <div class="fixed bottom-24 left-1/2 -translate-x-1/2 glass-nav bg-white/60 text-slate-900 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl z-[110] animate-fade-in whitespace-nowrap border border-white/60 backdrop-blur-md">
          Đã lưu thành công
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes bounce-subtle { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -6px); } }
    .animate-bounce-subtle { animation: bounce-subtle 2.5s infinite ease-in-out; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-fade-in-right { animation: fadeInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
    @keyframes fadeInRight { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
  `]
})
export class AttendanceViewComponent {
  store = inject(StoreService);
  selectedClass = signal<'mam' | 'choi' | 'la' | 'hoa'>('mam');
  
  draftAttendance = signal<Record<string, AttendanceEntry>>({});
  hasChanges = signal(false);
  showToast = signal(false);

  activeStudentIds = computed(() => new Set(this.store.students().map(s => s.id)));
  isToday = computed(() => this.store.currentDate() === this.store.getLocalDateString(new Date()));

  constructor() {
    effect(() => {
      const date = this.store.currentDate();
      const saved = this.store.attendance()[date] || {};
      
      if (Object.keys(saved).length === 0 && this.isToday()) {
        const initial: Record<string, AttendanceEntry> = {};
        this.store.students().forEach(s => {
          initial[s.id] = { present: false, name: s.name, classId: s.classId };
        });
        this.draftAttendance.set(initial);
      } else {
        this.draftAttendance.set({ ...saved });
      }
      this.hasChanges.set(false);
      this.store.hasUnsavedChanges.set(false);
    });

    effect(() => {
      this.store.hasUnsavedChanges.set(this.hasChanges());
    });
  }

  // Calculate Global Stats based on SAVED DATA for the selected date
  globalStats = computed(() => {
    const date = this.store.currentDate();
    const attendanceRecords = this.store.attendance();
    const dayRecord = attendanceRecords[date];
    
    // If no data saved for this date yet, return nulls to display '-'
    if (!dayRecord) {
        return { totalPresent: null, totalAbsent: null, totalStudents: null };
    }
    
    const entries = Object.values(dayRecord) as AttendanceEntry[];
    const present = entries.filter(e => e.present).length;
    const total = entries.length;

    return {
      totalPresent: present,
      totalAbsent: total - present,
      totalStudents: total
    };
  });

  // Calculate saved stats for ALL classes for the selected date
  allClassesSavedStats = computed(() => {
    const date = this.store.currentDate();
    const dayRecord = this.store.attendance()[date];
    
    const baseStats: { [key: string]: { present: number | null, total: number | null } } = {
      mam: { present: null, total: null },
      choi: { present: null, total: null },
      la: { present: null, total: null },
      hoa: { present: null, total: null },
    };

    if (!dayRecord) {
      return baseStats;
    }
    
    // Initialize with 0s since we have a record
    this.store.classes.forEach(cls => {
        baseStats[cls.id] = { present: 0, total: 0 };
    });
    
    for (const entry of Object.values(dayRecord) as AttendanceEntry[]) {
      const classStat = baseStats[entry.classId];
      if (classStat) {
        classStat.total!++;
        if (entry.present) {
          classStat.present!++;
        }
      }
    }
    
    return baseStats;
  });

  studentsInClass = computed(() => {
    const clsId = this.selectedClass();
    const draft = this.draftAttendance();
    if (this.isToday()) {
      return this.store.studentsByClass()[clsId];
    }
    return (Object.entries(draft) as [string, AttendanceEntry][])
      .filter(([_, entry]) => entry.classId === clsId)
      .map(([id, entry]) => ({ id, name: entry.name, classId: entry.classId }));
  });

  // This signal tracks DRAFT data for the Toggle All button logic
  draftStats = computed(() => {
    const list = this.studentsInClass();
    const draft = this.draftAttendance();
    const present = list.filter(s => {
      const entry = draft[s.id] as AttendanceEntry | undefined;
      return entry?.present;
    }).length;
    return { present, absent: list.length - present, total: list.length };
  });

  allPresent = computed(() => {
    const s = this.draftStats();
    return s.total > 0 && s.present === s.total;
  });

  presentStudentIds = computed(() => {
    const draft = this.draftAttendance();
    return new Set(
      Object.keys(draft).filter(studentId => draft[studentId]?.present)
    );
  });

  displayDate = computed(() => {
    const dateStr = this.store.currentDate();
    if (dateStr === this.store.getLocalDateString(new Date())) return 'Hôm nay';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  });

  canGoNext = computed(() => this.store.last14Days().indexOf(this.store.currentDate()) > 0);
  canGoPrev = computed(() => {
    const idx = this.store.last14Days().indexOf(this.store.currentDate());
    return idx >= 0 && idx < 13;
  });

  tryJumpDate(dir: number) {
    const days = this.store.last14Days();
    const idx = days.indexOf(this.store.currentDate()) + dir;
    if (idx >= 0 && idx < 14) {
      this.store.requestSafeAction(() => this.store.currentDate.set(days[idx]));
    }
  }

  tryGoToday() {
    const todayStr = this.store.getLocalDateString(new Date());
    this.store.requestSafeAction(() => this.store.currentDate.set(todayStr));
  }

  toggleStudent(id: string) {
    this.draftAttendance.update(draft => {
      const entry = draft[id];
      if (!entry) {
        const sInfo = this.store.students().find(s => s.id === id);
        return sInfo ? { ...draft, [id]: { present: true, name: sInfo.name, classId: sInfo.classId } } : draft;
      }
      return { ...draft, [id]: { ...entry, present: !entry.present } };
    });
    this.hasChanges.set(true);
  }

  toggleAll() {
    const list = this.studentsInClass();
    const target = !this.allPresent();
    this.draftAttendance.update(draft => {
      const next = { ...draft };
      list.forEach(s => {
        if (next[s.id]) next[s.id] = { ...next[s.id], present: target };
        else next[s.id] = { present: target, name: s.name, classId: s.classId };
      });
      return next;
    });
    this.hasChanges.set(true);
  }

  isRetired(id: string): boolean { return !this.activeStudentIds().has(id); }

  saveAttendance() {
    this.store.saveDayAttendance(this.store.currentDate(), this.draftAttendance());
    this.hasChanges.set(false);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 2000);
  }
}
