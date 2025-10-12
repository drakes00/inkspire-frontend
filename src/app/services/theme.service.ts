import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeKey = 'app-theme';
  private currentTheme: 'light' | 'dark' = 'light';

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
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
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
