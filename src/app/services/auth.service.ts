import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { UserProfile } from '../model/user.model';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    readonly baseUrl = environment.baseUrl;

    currentUser = signal<UserProfile | null>(null);

    login(credentials: any): Observable<any> {
        const url = `${this.baseUrl}/admin/users/login`;

        // Construct Basic Auth header required by Spring Security @PreAuthorize on /login
        const basicAuthCredentials = btoa(`${credentials.username}:${credentials.password}`);
        const headers = new HttpHeaders({
            'Authorization': `Basic ${basicAuthCredentials}`,
            'Content-Type': 'application/json'
        });

        // Pass headers along with the JSON payload
        return this.http.post<any>(url, credentials, { headers }).pipe(
            tap((response) => {
                console.log('Login response:', response);

                if (typeof window !== 'undefined' && response.token) {
                    // Save JWT token for subsequent requests
                    localStorage.setItem('token', response.token);

                    const userProfile: UserProfile = {
                        id: response.id,
                        username: response.username,
                        role: response.role,
                        profileImage: response.profileImage || null
                    };

                    localStorage.setItem('currentUser', JSON.stringify(userProfile));
                    this.currentUser.set(userProfile);
                }
            })
        );
    }

    forgotPassword(credentials: any): Observable<any> {
        const url = `${this.baseUrl}/auth/forgot-password`;
        return this.http.post<any>(url, credentials);
    }

    changePassword(passwords: any): Observable<any> {
        const url = `${this.baseUrl}/auth/change-password`;
        return this.http.post<any>(url, passwords);
    }

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            this.currentUser.set(null);
        }
    }

    isAuthenticated(): boolean {
        if (typeof window === 'undefined') {
            return false;
        }
        return !!localStorage.getItem('token');
    }

    initializeSession(): Promise<void> {
        return new Promise((resolve) => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                const userJson = localStorage.getItem('currentUser');

                if (token && userJson) {
                    try {
                        const user = JSON.parse(userJson);
                        this.currentUser.set(user);
                    } catch (e) {
                        console.error('Failed to parse user profile from localStorage', e);
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('token');
                    }
                }
            }
            resolve();
        });
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/register`, data);
    }
}
