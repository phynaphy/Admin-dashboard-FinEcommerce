import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { guestGuard } from './app/layout/core/guest.guard';
import { authGuard } from './app/layout/core/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'auth/login'
    },
    {
        path: 'auth/login',
        canActivate: [guestGuard],
        loadComponent: () => import('./app/pages/login/login/login').then((m) => m.Login),
    },
    {
        path: 'auth/forgot-password',
        canActivate: [guestGuard],
        loadComponent: () => import('./app/pages/login/forgot-password/forgot-password').then((m) => m.ForgotPassword),
    },
    {
        path: 'auth/register',
        canActivate: [guestGuard],
        loadComponent: () => import('./app/pages/login/register/register').then((m) => m.Register),
    },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            {
                path: 'products',
                loadComponent: () => import('./app/pages/product-list/product-list.component').then(m => m.ProductListComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('./app/pages/user-list/user-list.component').then(m => m.UserListComponent)
            },
            {
                path: 'categories',
                loadComponent: () => import('./app/pages/category-list/category-list.component').then(m => m.CategoryComponent)
            }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
