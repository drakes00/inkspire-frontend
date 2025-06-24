import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthGuard } from './services/auth.guard';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideAnimationsAsync('noop'), provideAnimationsAsync(), AuthGuard]
};
