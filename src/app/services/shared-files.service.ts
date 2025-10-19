import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedFilesService {
  // N.B. BehaviorSubject keep last val and share with subscribers
  private selectedFileSubject = new BehaviorSubject<any>(null);

  // Observable shareable
  public selectedFile$ = this.selectedFileSubject.asObservable();

  constructor() { }

  setSelectedFile(file: number | null): void {
    this.selectedFileSubject.next(file);
  }
}
