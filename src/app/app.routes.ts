import { Routes } from '@angular/router';
import { ConnectionPageComponent } from './components/connection-page/connection-page.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
    { path: '', component: ConnectionPageComponent, canActivate: [AuthGuard] },
    { path: 'login', component: ConnectionPageComponent, canActivate: [AuthGuard] },
    { path: 'main', component: MainPageComponent}];
