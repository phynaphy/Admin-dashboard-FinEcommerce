import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    let authReq = req;

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            authReq = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Check for HTTP 401 Unauthorized (Expired / Invalid Token)
            if (error.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                }
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
