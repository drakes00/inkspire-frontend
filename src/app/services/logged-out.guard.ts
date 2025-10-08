import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoggedOutAuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/main']); // Redirect to main page if token exists
      return false; // Prevent access to the login page
    } else {
      return true; // Allow access to the login page
    }
  }
}
