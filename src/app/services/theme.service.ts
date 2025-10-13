import { Injectable, inject } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeKey = 'app-theme';
  private currentTheme: 'light' | 'dark' = 'light';
  private overlayContainer = inject(OverlayContainer);

  constructor() {
    this.loadTheme();
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.themeKey) as 'light' | 'dark' | null;
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('light'); // Default theme
    }
  }

  private setTheme(theme: 'light' | 'dark') {
    this.currentTheme = theme;
    localStorage.setItem(this.themeKey, theme);
    const overlayContainerClasses = this.overlayContainer.getContainerElement().classList;

    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      overlayContainerClasses.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
      overlayContainerClasses.remove('dark-theme');
    }
  }

  toggleTheme() {
    if (this.currentTheme === 'light') {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }
}