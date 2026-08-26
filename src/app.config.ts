import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { appRoutes } from './app.routes';
import { AuthService } from './app/services/auth.service';
import { jwtInterceptor } from './app/layout/component/jwt.interceptor';

export function initAuth(authService: AuthService) {
    return () => authService.initializeSession();
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),

        // Single Router Provider combining all options
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
            withEnabledBlockingInitialNavigation()
        ),

        // Single HttpClient Provider with interceptor and fetch API support
        provideHttpClient(
            withFetch(),
            withInterceptors([jwtInterceptor]) // <--- THIS ATTACHES YOUR JWT TOKEN
        ),

        {
            provide: APP_INITIALIZER,
            useFactory: initAuth,
            deps: [AuthService],
            multi: true
        },

        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } })
    ]
};
