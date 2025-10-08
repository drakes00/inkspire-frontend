import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoggedInAuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      return true; // Allow access to the main page
    } else {
      this.router.navigate(['/login']); // Redirect to login page if no token
      return false;
    }
  }
}
