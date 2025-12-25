
import { Component, inject, ChangeDetectionStrategy, signal, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { StoreService, Student } from '../services/store.service';

declare var XLSX: any;

@Component({
  selector: 'app-student-manager',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col text-slate-800 relative">
      
      <!-- Lock Indicator - One line, large text, centered -->
      @if (!isToday()) {
        <div class="fixed inset-0 z-[150] flex items-center justify-center px-8 pointer-events-none animate-fade-in">
          <div class="bg-amber-500/90 backdrop-blur-md text-white px-8 py-5 rounded-[40px] flex items-center gap-4 shadow-[0_20px_50px_rgba(245,158,11,0.3)] border border-white/20 pointer-events-auto">
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <span class="material-icons-round text-xl text-white">lock</span>
            </div>
            <span class="text-[13px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Chỉnh sửa bị khóa</span>
          </div>
        </div>
      }

      <!-- Fixed Search/Add Bar - Moved up to top-[72px] to touch menu bottom exactly -->
      <div class="fixed top-[72px] inset-x-0 z-[100] px-6 flex justify-center pointer-events-none" [class.opacity-20]="!isToday()">
        <div class="w-full max-w-sm pointer-events-auto">
          <div class="relative p-3.5 glass-nav rounded-[28px] shadow-xl shadow-slate-900/5 border-white/10" [class.animate-slide-down]="isToday()">
            <div class="space-y-4">
              <form [formGroup]="studentForm" (ngSubmit)="onSubmit()" class="flex items-center gap-2.5">
                <div class="relative flex-1">
                  <span class="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">person_add</span>
                  <input #nameInput type="text" formControlName="name" [readonly]="!isToday()"
                    class="bg-white border border-slate-100 w-full rounded-full pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-200 transition-all text-[13px] font-bold placeholder:text-slate-300 shadow-sm"
                    placeholder="Tên bé...">
                </div>
                <button type="submit" [disabled]="studentForm.invalid || !isToday()"
                  class="w-10 h-10 flex-shrink-0 bg-slate-800 text-white rounded-full flex items-center justify-center active:scale-90 transition-all disabled:opacity-20 shadow-lg">
                  <span class="material-icons-round text-xl">add</span>
                </button>
              </form>

              <!-- Class Tabs -->
              <div class="flex flex-wrap justify-center gap-1.5 px-1 pb-1">
                @for (cls of store.classes; track cls.id) {
                  <button (click)="isToday() && selectedClassId.set(cls.id)"
                    [class]="selectedClassId() === cls.id 
                      ? 'bg-white/45 border-white/50 scale-105 shadow-sm ' + cls.activeTextColor
                      : 'bg-white/10 text-slate-400 border-white/10'"
                    class="px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 border active:scale-95">
                    {{ cls.name }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main List - Reduced padding top to pt-[130px] to match new header position -->
      <div class="px-5 space-y-3 relative z-10 animate-fade-in pt-[130px]" [class.opacity-40]="!isToday()">
        <div class="flex items-center justify-between gap-1.5 mb-1.5 mx-2">
          <div class="flex items-center gap-1.5">
            <h4 class="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Tổng: {{ store.students().length }} | Lớp {{ activeClassName() }}: {{ currentClassStudents().length }}
            </h4>
          </div>
          <div class="flex items-center gap-2">
            <!-- Swapped order: Upload button first -->
            <button (click)="isToday() && fileInput.click()" [disabled]="!isToday()"
                    class="w-8 h-8 rounded-full flex items-center justify-center text-emerald-500 bg-emerald-50/80 active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm border border-emerald-100">
                <span class="material-icons-round text-base">upload_file</span>
            </button>
            <input type="file" #fileInput class="hidden" (change)="onFileChange($event)" accept=".xlsx, .xls">

            @if (store.students().length > 0) {
              <button (click)="isToday() && showDeleteAllConfirm.set(true)" [disabled]="!isToday()"
                      class="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 bg-rose-50/80 active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm border border-rose-100">
                <span class="material-icons-round text-base">delete_sweep</span>
              </button>
            }
          </div>
        </div>

        @if (currentClassStudents().length === 0) {
          <div class="py-10 text-center">
             <p class="text-slate-300 text-[9px] font-black uppercase tracking-widest">Danh sách trống</p>
          </div>
        }

        <div class="space-y-2">
          @for (student of currentClassStudents(); track student.id) {
            <div class="glass-card rounded-2xl py-3 px-5 flex items-center justify-between border border-white/50 shadow-sm relative transition-all duration-200">
              @if (editingId() === student.id) {
                <div class="w-full flex flex-col gap-3 py-1 animate-fade-in">
                  <div class="flex items-center gap-2">
                    <input type="text" [formControl]="editNameControl" (keydown.enter)="saveEdit()" autofocus
                      class="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 font-bold focus:outline-none text-[13px] shadow-sm">
                    
                    <button (click)="saveEdit()" [disabled]="editNameControl.invalid" 
                            class="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-90 shrink-0">
                      <span class="material-icons-round text-lg">check</span>
                    </button>
                    
                    <button (click)="cancelEdit()" 
                            class="w-9 h-9 rounded-full bg-white text-slate-400 flex items-center justify-center border border-slate-200 active:scale-90 shadow-sm shrink-0">
                      <span class="material-icons-round text-lg">close</span>
                    </button>
                  </div>

                  <div class="grid grid-cols-4 gap-1.5">
                    @for (cls of store.classes; track cls.id) {
                      <button (click)="editClassControl.setValue(cls.id)"
                        [class]="editClassControl.value === cls.id 
                          ? 'bg-white/50 border-white/60 scale-100 shadow-sm ' + cls.activeTextColor
                          : 'bg-slate-100/50 text-slate-400 border-white/10 opacity-60'"
                        class="w-full py-2 rounded-xl text-[8px] font-black uppercase border transition-all text-center">
                        {{ cls.name }}
                      </button>
                    }
                  </div>
                </div>
              } @else {
                <div class="flex-1 min-w-0">
                  <span class="font-bold text-slate-700 text-[14px] truncate block tracking-tight">{{ student.name }}</span>
                </div>
                <div class="flex items-center gap-1 z-20">
                  <button (click)="isToday() && startEdit(student)" [class.opacity-10]="!isToday()"
                          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 bg-slate-50 active:scale-90">
                    <span class="material-icons-round text-base">edit</span>
                  </button>
                  <button (click)="isToday() && confirmDelete(student.id, student.name)" [class.opacity-10]="!isToday()"
                          class="w-8 h-8 rounded-full flex items-center justify-center text-rose-300 bg-rose-50 active:scale-90">
                    <span class="material-icons-round text-base">delete</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Individual Popups -->
      @if (studentToDelete()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-8">
          <div class="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" (click)="cancelDelete()"></div>
          <div class="bg-white rounded-3xl p-6 w-full max-w-[280px] shadow-2xl relative z-10 animate-popup border border-white">
            <h3 class="text-sm font-black text-slate-800 mb-1 text-center uppercase tracking-tight">Xóa bé?</h3>
            <p class="text-slate-400 text-[11px] mb-5 text-center px-2 font-medium">Thông tin bé sẽ bị gỡ bỏ khỏi hệ thống.</p>
            <div class="flex gap-2">
              <button (click)="cancelDelete()" class="flex-1 py-2.5 rounded-xl bg-slate-50 font-black text-[9px] text-slate-400 tracking-widest uppercase">HỦY</button>
              <button (click)="doDelete()" class="flex-1 py-2.5 rounded-xl bg-rose-500 font-black text-[9px] text-white shadow-lg tracking-widest uppercase">XÓA</button>
            </div>
          </div>
        </div>
      }

      <!-- Delete All Confirmations -->
      @if (showDeleteAllConfirm()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-8">
          <div class="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" (click)="showDeleteAllConfirm.set(false)"></div>
          <div class="bg-white rounded-3xl p-6 w-full max-w-[280px] shadow-2xl relative z-10 animate-popup border border-rose-100">
            <div class="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="material-icons-round text-rose-500">warning</span>
            </div>
            <h3 class="text-sm font-black text-slate-800 mb-1 text-center uppercase tracking-tight">Xóa tất cả?</h3>
            <p class="text-slate-400 text-[11px] mb-5 text-center px-2 font-medium">
              Toàn bộ danh sách học sinh ({{ store.students().length }} bé) sẽ bị xóa sạch.
            </p>
            <div class="flex gap-2">
              <button (click)="showDeleteAllConfirm.set(false)" class="flex-1 py-2.5 rounded-xl bg-slate-50 font-black text-[9px] text-slate-400 tracking-widest uppercase">QUAY LẠI</button>
              <button (click)="doDeleteAll()" class="flex-1 py-2.5 rounded-xl bg-rose-600 font-black text-[9px] text-white shadow-lg tracking-widest uppercase">XÓA HẾT</button>
            </div>
          </div>
        </div>
      }
      
      <!-- Import Confirmations -->
      @if (studentsToImport()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-8">
          <div class="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" (click)="cancelImport()"></div>
          <div class="bg-white rounded-3xl p-6 w-full max-w-[280px] shadow-2xl relative z-10 animate-popup border border-white">
            <h3 class="text-sm font-black text-slate-800 mb-1 text-center uppercase tracking-tight">Xác nhận nhập liệu</h3>
            <p class="text-slate-400 text-[11px] mb-5 text-center px-2 font-medium">
              Bạn có muốn thay thế toàn bộ danh sách với 
              <span class="font-bold text-emerald-600">{{ studentsToImport()!.length }}</span> bé từ file Excel?
            </p>
            <div class="flex gap-2">
              <button (click)="cancelImport()" class="flex-1 py-2.5 rounded-xl bg-slate-50 font-black text-[9px] text-slate-400 tracking-widest uppercase">HỦY</button>
              <button (click)="confirmImport()" class="flex-1 py-2.5 rounded-xl bg-emerald-500 font-black text-[9px] text-white shadow-lg tracking-widest uppercase">THAY THẾ</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-popup { animation: popup 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes popup { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentManagerComponent {
  store = inject(StoreService);
  private readonly fb: FormBuilder = inject(FormBuilder);

  readonly studentForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]]
  });

  nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  studentToDelete = signal<{id: string, name: string} | null>(null);
  studentsToImport = signal<{name: string, classId: 'mam' | 'choi' | 'la' | 'hoa'}[] | null>(null);
  showDeleteAllConfirm = signal(false);

  editingId = signal<string | null>(null);
  
  editNameControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] });
  editClassControl = new FormControl<'mam' | 'choi' | 'la' | 'hoa'>('mam', { nonNullable: true });
  
  selectedClassId = signal<'mam' | 'choi' | 'la' | 'hoa'>('mam');

  isToday = computed(() => this.store.currentDate() === this.store.getLocalDateString(new Date()));
  currentClassStudents = computed(() => this.store.studentsByClass()[this.selectedClassId()]);

  activeClassName = computed(() => this.store.classes.find(c => c.id === this.selectedClassId())?.name || '');

  onSubmit() {
    if (this.isToday() && this.studentForm.valid) {
      const name = (this.studentForm.value as any).name!;
      this.store.addStudent(name, this.selectedClassId());
      this.studentForm.reset();
      setTimeout(() => this.nameInput()?.nativeElement.focus(), 0);
    }
  }

  startEdit(student: Student) {
    if (!this.isToday()) return;
    this.editingId.set(student.id);
    this.editNameControl.setValue(student.name);
    this.editClassControl.setValue(student.classId);
  }

  cancelEdit() { 
    this.editingId.set(null); 
    this.editNameControl.reset(); 
  }

  saveEdit() {
    if (this.isToday() && this.editingId() && this.editNameControl.valid) {
      this.store.updateStudent(this.editingId()!, this.editNameControl.value, this.editClassControl.value);
      this.cancelEdit();
    }
  }

  confirmDelete(id: string, name: string) {
    if (!this.isToday()) return;
    if (this.editingId() === id) this.cancelEdit();
    this.studentToDelete.set({ id, name });
  }

  cancelDelete() { this.studentToDelete.set(null); }
  doDelete() {
    if (this.studentToDelete()) {
      this.store.removeStudent(this.studentToDelete()!.id);
      this.studentToDelete.set(null);
    }
  }

  doDeleteAll() {
    this.store.replaceAllStudents([]);
    this.showDeleteAllConfirm.set(false);
  }

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      // FIX: Changed UintArray to Uint8Array
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const importedStudents: {name: string, classId: 'mam' | 'choi' | 'la' | 'hoa'}[] = [];
      const classMap: {[key: string]: 'mam' | 'choi' | 'la' | 'hoa'} = { 'B': 'mam', 'C': 'choi', 'D': 'la', 'E': 'hoa' };
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const maxRow = range.e.r;

      for (let row = 1; row <= maxRow; row++) {
        for (const col of ['B', 'C', 'D', 'E']) {
          const cell = worksheet[col + (row + 1)];
          if (cell && cell.v) {
            const name = String(cell.v).trim();
            if (name) {
              importedStudents.push({ name, classId: classMap[col] });
            }
          }
        }
      }
      
      if (importedStudents.length > 0) {
        this.studentsToImport.set(importedStudents);
      } else {
        this.cancelImport();
      }
    };
    reader.readAsArrayBuffer(file);
  }

  confirmImport() {
    if (this.studentsToImport()) {
      this.store.replaceAllStudents(this.studentsToImport()!);
      this.cancelImport();
    }
  }

  cancelImport() {
    this.studentsToImport.set(null);
    const fileInputEl = this.fileInput()?.nativeElement;
    if (fileInputEl) {
      fileInputEl.value = '';
    }
  }
}