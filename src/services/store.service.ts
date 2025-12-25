
import { Injectable, signal, computed, effect } from '@angular/core';

export interface Student {
  id: string;
  name: string;
  classId: 'mam' | 'choi' | 'la' | 'hoa';
  createdAt: string;
}

export interface AttendanceEntry {
  present: boolean;
  name: string;
  classId: 'mam' | 'choi' | 'la' | 'hoa';
}

export interface AttendanceRecord {
  [date: string]: { [studentId: string]: AttendanceEntry };
}

export interface ClassGroup {
  id: 'mam' | 'choi' | 'la' | 'hoa';
  name: string;
  color: string;
  activeColor: string;
  activeTextColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  readonly classes: ClassGroup[] = [
    { id: 'mam', name: 'Mầm', color: 'bg-white border-emerald-200 text-emerald-600 shadow-sm hover:bg-emerald-50', activeColor: 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-200 border-transparent', activeTextColor: 'text-emerald-600' },
    { id: 'choi', name: 'Chồi', color: 'bg-white border-amber-200 text-amber-600 shadow-sm hover:bg-amber-50', activeColor: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200 border-transparent', activeTextColor: 'text-amber-600' },
    { id: 'la', name: 'Lá', color: 'bg-white border-cyan-200 text-cyan-600 shadow-sm hover:bg-cyan-50', activeColor: 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-200 border-transparent', activeTextColor: 'text-cyan-600' },
    { id: 'hoa', name: 'Hoa', color: 'bg-white border-rose-200 text-rose-600 shadow-sm hover:bg-rose-50', activeColor: 'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-lg shadow-rose-200 border-transparent', activeTextColor: 'text-rose-600' }
  ];

  private readonly STORAGE_STUDENTS = 'hoasen_students';
  private readonly STORAGE_ATTENDANCE = 'hoasen_attendance';

  readonly students = signal<Student[]>(
    this.loadFromStorage(this.STORAGE_STUDENTS, [
      { id: '1', name: 'Nguyễn Văn An', classId: 'mam', createdAt: '2024-01-01' },
      { id: '2', name: 'Trần Thị Bích', classId: 'mam', createdAt: '2024-01-01' }
    ])
  );

  readonly attendance = signal<AttendanceRecord>(
    this.loadFromStorage(this.STORAGE_ATTENDANCE, {})
  );

  readonly currentDate = signal<string>(this.getLocalDateString(new Date()));
  readonly currentTab = signal<'attendance' | 'students' | 'history' | 'info'>('attendance');
  
  readonly hasUnsavedChanges = signal<boolean>(false);
  readonly isConfirmingExit = signal<boolean>(false);
  private pendingAction: (() => void) | null = null;

  // PWA State
  readonly isInstalled = signal<boolean>(false);
  readonly canInstallNow = signal<boolean>(false);

  constructor() {
    effect(() => {
        try {
            localStorage.setItem(this.STORAGE_STUDENTS, JSON.stringify(this.students()));
        } catch (e) { console.error('Lỗi lưu học sinh:', e); }
    });
    effect(() => {
        try {
            localStorage.setItem(this.STORAGE_ATTENDANCE, JSON.stringify(this.attendance()));
        } catch (e) { console.error('Lỗi lưu điểm danh:', e); }
    });
    this.checkPwaStatus();
  }

  checkPwaStatus() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                      || (window.navigator as any).standalone;
    this.isInstalled.set(isStandalone);
    
    // Kiểm tra xem prompt đã sẵn sàng chưa
    if ((window as any).deferredPrompt) {
      this.canInstallNow.set(true);
    }
  }

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Lỗi đọc dữ liệu ${key}, reset về mặc định`, e);
      return defaultValue;
    }
  }

  getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  saveDayAttendance(date: string, dayData: { [studentId: string]: AttendanceEntry }) {
    this.attendance.update(records => ({ ...records, [date]: dayData }));
    this.hasUnsavedChanges.set(false);
  }

  requestSafeAction(action: () => void) {
    if (this.hasUnsavedChanges()) {
      this.pendingAction = action;
      this.isConfirmingExit.set(true);
    } else {
      action();
    }
  }

  confirmExit() {
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
    this.hasUnsavedChanges.set(false);
    this.isConfirmingExit.set(false);
  }

  cancelExit() {
    this.pendingAction = null;
    this.isConfirmingExit.set(false);
  }

  addStudent(name: string, classId: 'mam' | 'choi' | 'la' | 'hoa') {
    const id = Date.now().toString();
    this.students.update(list => [...list, { id, name, classId, createdAt: this.getLocalDateString(new Date()) }]);
  }

  removeStudent(id: string) {
    this.students.update(list => list.filter(s => s.id !== id));
  }

  updateStudent(id: string, newName: string, newClassId: 'mam' | 'choi' | 'la' | 'hoa') {
    this.students.update(list => list.map(s => s.id === id ? { ...s, name: newName, classId: newClassId } : s));
  }

  replaceAllStudents(newStudentData: {name: string, classId: 'mam' | 'choi' | 'la' | 'hoa'}[]) {
    const newStudents: Student[] = newStudentData.map((s, index) => ({
      id: `${Date.now()}-${index}`,
      name: s.name,
      classId: s.classId,
      createdAt: this.getLocalDateString(new Date())
    }));
    this.students.set(newStudents);
  }

  getHistoryStats() {
    const records = this.attendance();
    return this.last14Days().map(dateStr => {
      const record = records[dateStr];
      const [y, m, d] = dateStr.split('-');
      if (!record) return { date: dateStr, displayDate: `${d}/${m}/${y}`, present: null, absent: null, total: null };
      const entries = Object.values(record) as AttendanceEntry[];
      const present = entries.filter(e => e.present).length;
      return { date: dateStr, displayDate: `${d}/${m}/${y}`, present, absent: entries.length - present, total: entries.length };
    });
  }

  readonly last14Days = computed(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(this.getLocalDateString(d));
    }
    return dates;
  });

  readonly studentsByClass = computed(() => {
    const list = this.students();
    return {
      mam: list.filter(s => s.classId === 'mam'),
      choi: list.filter(s => s.classId === 'choi'),
      la: list.filter(s => s.classId === 'la'),
      hoa: list.filter(s => s.classId === 'hoa')
    };
  });

  readonly dailyStats = computed(() => {
    const todayDate = this.getLocalDateString(new Date());
    const dayRecord = this.attendance()[todayDate];
    if (dayRecord) {
      const entries = Object.values(dayRecord) as AttendanceEntry[];
      const present = entries.filter(e => e.present).length;
      return { totalStudents: entries.length, totalPresent: present, totalAbsent: entries.length - present };
    }
    return { totalStudents: null, totalPresent: null, totalAbsent: null };
  });
}