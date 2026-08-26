import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token'); // Matches AuthService key

        if (token) {
            const clonedReq = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
            return next(clonedReq);
        }
    }

    return next(req);
};
