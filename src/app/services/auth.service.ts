// import { Injectable, inject, signal } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { environment } from '../../environments/environment';
// import { Observable, tap } from 'rxjs';
// import { UserProfile } from '../model/user.model';
//
// @Injectable({
//     providedIn: 'root',
// })
// export class AuthService {
//     private http = inject(HttpClient);
//     readonly baseUrl = environment.baseUrl;
//
//     currentUser = signal<UserProfile | null>(null);
//
//     login(credentials: any): Observable<any> {
//         const url = `${this.baseUrl}/admin/auth/login`;
//
//         // Construct Basic Auth header required by Spring Security @PreAuthorize on /login
//         const basicAuthCredentials = btoa(`${credentials.username}:${credentials.password}`);
//         const headers = new HttpHeaders({
//             'Authorization': `Basic ${basicAuthCredentials}`,
//             'Content-Type': 'application/json'
//         });
//
//         // Pass headers along with the JSON payload
//         return this.http.post<any>(url, credentials, { headers }).pipe(
//             tap((response) => {
//                 console.log('Login response:', response);
//
//                 if (typeof window !== 'undefined' && response.token) {
//                     // Save JWT token for subsequent requests
//                     localStorage.setItem('token', response.token);
//
//                     const userProfile: UserProfile = {
//                         id: response.id,
//                         username: response.username,
//                         role: response.role,
//                         profileImage: response.profileImage || null
//                     };
//
//                     localStorage.setItem('currentUser', JSON.stringify(userProfile));
//                     this.currentUser.set(userProfile);
//                 }
//             })
//         );
//     }
//
//     forgotPassword(credentials: any): Observable<any> {
//         const url = `${this.baseUrl}/auth/forgot-password`;
//         return this.http.post<any>(url, credentials);
//     }
//
//     changePassword(passwords: any): Observable<any> {
//         const url = `${this.baseUrl}/auth/change-password`;
//         return this.http.post<any>(url, passwords);
//     }
//
//     logout() {
//         if (typeof window !== 'undefined') {
//             localStorage.removeItem('token');
//             localStorage.removeItem('currentUser');
//             this.currentUser.set(null);
//         }
//     }
//
//     isAuthenticated(): boolean {
//         if (typeof window === 'undefined') {
//             return false;
//         }
//         return !!localStorage.getItem('token');
//     }
//
//     initializeSession(): Promise<void> {
//         return new Promise((resolve) => {
//             if (typeof window !== 'undefined') {
//                 const token = localStorage.getItem('token');
//                 const userJson = localStorage.getItem('currentUser');
//
//                 if (token && userJson) {
//                     try {
//                         const user = JSON.parse(userJson);
//                         this.currentUser.set(user);
//                     } catch (e) {
//                         console.error('Failed to parse user profile from localStorage', e);
//                         localStorage.removeItem('currentUser');
//                         localStorage.removeItem('token');
//                     }
//                 }
//             }
//             resolve();
//         });
//     }
//
//     register(data: any): Observable<any> {
//         return this.http.post(`${this.baseUrl}/register`, data);
//     }
// }

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';
import { UserProfile } from '../model/user.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    readonly baseUrl = environment.baseUrl;

    private expirationTimer: ReturnType<typeof setTimeout> | null = null;

    // Safely initialize the signal synchronously on field initialization
    currentUser = signal<UserProfile | null>(this.loadInitialUser());

    constructor() {
        // If a valid session was loaded during field initialization, start the auto-logout timer now
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token && !this.isTokenExpired(token)) {
            this.startAutoLogoutTimer(token);
        }
    }

    /**
     * Pure function that restores stored user profile or cleans up storage if invalid/expired.
     * DO NOT access `this.currentUser` inside this function.
     */
    private loadInitialUser(): UserProfile | null {
        if (typeof window === 'undefined') return null;

        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('currentUser');

        if (token && !this.isTokenExpired(token) && userJson) {
            try {
                return JSON.parse(userJson) as UserProfile;
            } catch (e) {
                console.error('Failed to parse stored user profile:', e);
            }
        }

        // Clean up storage synchronously without calling `this.clearSession()` or `this.currentUser`
        this.clearStorageOnly();
        return null;
    }

    login(credentials: any): Observable<any> {
        const url = `${this.baseUrl}/admin/auth/login`;

        const basicAuthCredentials = btoa(`${credentials.username}:${credentials.password}`);
        const headers = new HttpHeaders({
            'Authorization': `Basic ${basicAuthCredentials}`,
            'Content-Type': 'application/json'
        });

        return this.http.post<any>(url, credentials, { headers }).pipe(
            tap((response) => {
                if (typeof window !== 'undefined' && response.token) {
                    localStorage.setItem('token', response.token);

                    const userProfile: UserProfile = {
                        id: response.id,
                        username: response.username,
                        role: response.role,
                        profileImage: response.profileImage || null
                    };

                    localStorage.setItem('currentUser', JSON.stringify(userProfile));
                    this.currentUser.set(userProfile);

                    // Start timer immediately upon logging in
                    this.startAutoLogoutTimer(response.token);
                }
            })
        );
    }

    /**
     * Schedules an automated client-side logout the exact millisecond the token expires.
     */
    private startAutoLogoutTimer(token: string): void {
        this.clearTimer();

        try {
            const decoded: { exp?: number } = jwtDecode(token);
            if (!decoded.exp) return;

            const expiresAtMs = decoded.exp * 1000;
            const timeoutMs = expiresAtMs - Date.now();

            if (timeoutMs > 0) {
                this.expirationTimer = setTimeout(() => {
                    console.warn('JWT token expired! Logging out automatically.');
                    this.logout();
                }, timeoutMs);
            } else {
                this.logout();
            }
        } catch (e) {
            this.logout();
        }
    }

    private clearTimer(): void {
        if (this.expirationTimer) {
            clearTimeout(this.expirationTimer);
            this.expirationTimer = null;
        }
    }

    forgotPassword(credentials: any): Observable<any> {
        const url = `${this.baseUrl}/auth/forgot-password`;
        return this.http.post<any>(url, credentials);
    }

    changePassword(passwords: any): Observable<any> {
        const url = `${this.baseUrl}/auth/change-password`;
        return this.http.post<any>(url, passwords);
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/register`, data);
    }

    isTokenExpired(token?: string | null): boolean {
        const jwtToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (!jwtToken) return true;

        try {
            const decoded: { exp?: number } = jwtDecode(jwtToken);
            if (!decoded.exp) return false;

            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (e) {
            return true;
        }
    }

    isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;
        const token = localStorage.getItem('token');
        return !!token && !this.isTokenExpired(token);
    }

    /**
     * Helper to purge localStorage without triggering Signal updates.
     */
    private clearStorageOnly(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
        }
    }

    /**
     * Clears timer, local storage, and resets signal state.
     */
    clearSession(): void {
        this.clearTimer();
        this.clearStorageOnly();
        if (this.currentUser) {
            this.currentUser.set(null);
        }
    }

    /**
     * Full logout action: clears state, resets timers, and redirects to login page.
     */
    logout(): void {
        this.clearSession();
        this.router.navigate(['/auth/login']);
    }
}
