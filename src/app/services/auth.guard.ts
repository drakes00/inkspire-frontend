import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
    if (token) {
      this.router.navigate(['/main']); // Redirect to main page if token exists
      return false; // Prevent access to the login page
    }
    return true; // Allow access to the login page
  }
}
