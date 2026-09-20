import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Route, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/dashboard">
                    <span>Admin</span>
                </a>
            </div>

            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                        <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                    </button>
                    <div class="relative">
                        <button
                            class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>

                <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                    <i class="pi pi-ellipsis-v"></i>
                </button>

                <div class="layout-topbar-menu hidden lg:block">
                    <div class="layout-topbar-menu-content">
                        <button type="button" class="layout-topbar-action">
                            <i class="pi pi-calendar"></i>
                            <span>Calendar</span>
                        </button>
                        <button type="button" class="layout-topbar-action">
                            <i class="pi pi-inbox"></i>
                            <span>Messages</span>
                        </button>

                        <!-- Profile Dropdown Section -->
                        <div class="relative">
                            <button
                                type="button"
                                class="layout-topbar-action"
                                pStyleClass="@next"
                                enterFromClass="hidden"
                                enterActiveClass="animate-scalein"
                                leaveToClass="hidden"
                                leaveActiveClass="animate-fadeout"
                                [hideOnOutsideClick]="true"
                            >
                                <i class="pi pi-user"></i>
                                <span>Profile</span>
                            </button>

                            <!-- PrimeNG Overlay Menu Markup -->
                            <div class="p-menu p-component p-menu-overlay hidden absolute right-0 top-full mt-2 w-56 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xl p-1.5 z-50">
                                <ul class="p-menu-list p-reset flex flex-col gap-0.5 m-0 p-0 list-none">
                                    <li class="p-menuitem">
                                        <a routerLink="/profile" class="p-menuitem-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-700 dark:text-surface-0/80 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-0 transition-colors duration-150 no-underline cursor-pointer">
                                            <span class="p-menuitem-icon pi pi-user text-lg text-surface-500 dark:text-surface-400"></span>
                                            <span class="p-menuitem-text text-sm font-medium">Profile</span>
                                        </a>
                                    </li>
                                    <li class="p-menuitem">
                                        <a routerLink="/change-password" class="p-menuitem-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-surface-700 dark:text-surface-0/80 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-0 transition-colors duration-150 no-underline cursor-pointer">
                                            <span class="p-menuitem-icon pi pi-key text-lg text-surface-500 dark:text-surface-400"></span>
                                            <span class="p-menuitem-text text-sm font-medium">Change Password</span>
                                        </a>
                                    </li>

                                    <li class="p-menu-separator border-t border-surface-200 dark:border-surface-700/60 my-1.5" role="separator"></li>

                                    <li class="p-menuitem">
                                        <a (click)="logout()" class="p-menuitem-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-150 no-underline cursor-pointer">
                                            <span class="p-menuitem-icon pi pi-sign-out text-lg text-red-500 dark:text-red-400"></span>
                                            <span class="p-menuitem-text text-sm font-semibold">Log Out</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>`
})
export class AppTopbar {
    items!: MenuItem[];


    constructor(public layoutService: LayoutService, private router: Router) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    logout(){
        this.layoutService.logout().subscribe({
            next: (response) => {
                // Clear local storage / session tokens if needed
                localStorage.removeItem('token');

                // Redirect user to login page
                this.router.navigate(['/auth/login']);
            },
            error: (err) => {
                console.error('Logout failed:', err);
                // Optionally still clear token and redirect on error
                this.router.navigate(['/auth/login']);
            }
        });
    }

}
