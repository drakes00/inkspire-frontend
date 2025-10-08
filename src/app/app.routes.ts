import { Routes } from '@angular/router';
import { ConnectionPageComponent } from './components/connection-page/connection-page.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { LoggedInAuthGuard } from './services/logged-in.guard';
import { LoggedOutAuthGuard } from './services/logged-out.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'main', pathMatch: 'full' },
    { path: 'login', component: ConnectionPageComponent, canActivate: [LoggedOutAuthGuard] },
    { path: 'main', component: MainPageComponent, canActivate: [LoggedInAuthGuard] },
];
