
import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService, AttendanceEntry } from '../services/store.service';

declare var XLSX: any;

@Component({
  selector: 'app-history-view',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Thêm pt-6 để tạo khoảng cách với menu -->
    <div class="flex flex-col text-slate-800 px-5 pt-6">
      @let data = historyData();

      <div class="flex items-center justify-between px-3 mb-4 opacity-40">
        <span class="text-[9px] font-black uppercase tracking-[0.2em]">Lịch sử ghi nhận</span>
        <span class="text-[8px] font-black uppercase tracking-[0.2em] italic">14 ngày gần nhất</span>
      </div>

      <div class="space-y-3 pb-20">
        @for (day of data; track day.date) {
          <div [class]="day.total === null ? 'opacity-50 grayscale-[0.5]' : ''"
               class="glass-card rounded-3xl py-4 px-5 flex items-center justify-between border-white shadow-sm transition-all relative overflow-hidden">
            
            <!-- Left Info -->
            <div class="flex flex-col min-w-[70px]">
              <span class="text-[13px] font-black text-slate-700 tracking-tight leading-none mb-1.5">
                {{ day.displayDate }}
              </span>
              <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                {{ day.date === today() ? 'Hôm nay' : 'Lịch sử' }}
              </span>
            </div>

            <!-- Stats (Middle) - 3 parameters according to user request -->
            <div class="flex items-center gap-1.5 flex-1 justify-center px-1">
              <div class="flex flex-col items-center">
                <span [class]="day.present !== null ? 'text-emerald-600' : 'text-slate-300'" 
                      class="text-[11px] font-black leading-none">
                  {{ day.present ?? '-' }}
                </span>
                <span class="text-[5px] font-black text-slate-400 uppercase mt-1">Hiện</span>
              </div>
              
              <div class="w-[0.5px] h-3 bg-slate-100"></div>

              <div class="flex flex-col items-center">
                <span [class]="day.absent !== null ? 'text-rose-500' : 'text-slate-300'" 
                      class="text-[11px] font-black leading-none">
                  {{ day.absent ?? '-' }}
                </span>
                <span class="text-[5px] font-black text-slate-400 uppercase mt-1">Vắng</span>
              </div>

              <div class="w-[0.5px] h-3 bg-slate-100"></div>

              <div class="flex flex-col items-center">
                <span [class]="day.total !== null ? 'text-slate-600' : 'text-slate-300'" 
                      class="text-[11px] font-black leading-none">
                  {{ day.total ?? '-' }}
                </span>
                <span class="text-[5px] font-black text-slate-400 uppercase mt-1">Tổng</span>
              </div>
            </div>

            <!-- Actions (Right) -->
            <div class="flex items-center gap-1.5">
              <!-- Nút Xuất Excel -->
              <button (click)="day.total !== null && exportExcel(day.date, day.displayDate)"
                      [disabled]="day.total === null"
                      [class]="day.total === null ? 'bg-slate-50 text-slate-200' : 'bg-emerald-50 text-emerald-500 active:scale-90'"
                      class="w-9 h-9 rounded-full flex items-center justify-center transition-all border border-emerald-100/50 shadow-sm">
                <span class="material-icons-round text-lg">description</span>
              </button>

              <!-- Nút Chỉnh sửa: Chỉ bấm được khi có dữ liệu (day.total !== null) -->
              <button (click)="day.total !== null && viewDate(day.date)"
                      [disabled]="day.total === null"
                      [class]="day.total === null ? 'bg-slate-50 text-slate-200 shadow-none' : 'bg-slate-800 text-white shadow-lg shadow-slate-200 active:scale-90'"
                      class="w-9 h-9 rounded-full flex items-center justify-center transition-all">
                <span class="material-icons-round text-lg">edit</span>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class HistoryViewComponent {
  store = inject(StoreService);
  
  today = computed(() => this.store.getLocalDateString(new Date()));

  historyData = computed(() => {
    return this.store.getHistoryStats();
  });

  viewDate(dateStr: string) {
    this.store.currentDate.set(dateStr);
    this.store.currentTab.set('attendance');
  }

  exportExcel(dateStr: string, displayDate: string) {
    const record = this.store.attendance()[dateStr];
    if (!record) return;

    const students = Object.entries(record) as [string, AttendanceEntry][];
    
    // Nhóm học sinh theo lớp
    const groups = {
      mam: students.filter(([_, e]) => e.classId === 'mam'),
      choi: students.filter(([_, e]) => e.classId === 'choi'),
      la: students.filter(([_, e]) => e.classId === 'la'),
      hoa: students.filter(([_, e]) => e.classId === 'hoa')
    };

    // Tìm số lượng học sinh lớn nhất của một lớp để xác định số dòng
    const maxRows = Math.max(
      groups.mam.length,
      groups.choi.length,
      groups.la.length,
      groups.hoa.length
    );

    // Chuẩn bị dữ liệu bảng
    const wsData: (string | number)[][] = [
      ['STT', 'Lớp Mầm', 'Lớp Chồi', 'Lớp Lá', 'Lớp Hoa']
    ];

    // Các hàng dữ liệu
    for (let i = 0; i < maxRows; i++) {
      const row = [
        i + 1, // STT
        this.formatStudentName(groups.mam[i]?.[1]),
        this.formatStudentName(groups.choi[i]?.[1]),
        this.formatStudentName(groups.la[i]?.[1]),
        this.formatStudentName(groups.hoa[i]?.[1])
      ];
      wsData.push(row);
    }

    // Tạo Workbook và Download
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Thiết lập độ rộng cột cơ bản
    ws['!cols'] = [
      { wch: 5 },  // STT
      { wch: 20 }, // Mầm
      { wch: 20 }, // Chồi
      { wch: 20 }, // Lá
      { wch: 20 }  // Hoa
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diem Danh');
    
    const fileName = `Diem_Danh_${displayDate.replace(/\//g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  private formatStudentName(entry: AttendanceEntry | undefined): string {
    if (!entry) return '';
    return entry.present ? entry.name : `${entry.name} (Vắng)`;
  }
}