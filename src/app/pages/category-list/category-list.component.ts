import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryService } from '../../services/CategoryService';
import { CategoryResponse } from '../../model/category.model';
import { AuthService } from '../../services/auth.service';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-category',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        ToastModule,
        ConfirmDialogModule,
        TooltipModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './category-list.component.html',
    styleUrl: './category-list.component.scss'
})
export class CategoryComponent implements OnInit {
    categories = signal<CategoryResponse[]>([]);
    isLoading = signal<boolean>(false);
    isSaving = signal<boolean>(false);

    categoryDialog: boolean = false;
    category: { id?: number; name: string } = { name: '' };

    // Form field tracking for inline error UI
    nameSubmitted: boolean = false;

    constructor(
        private categoryService: CategoryService,
        public authService: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.isLoading.set(true);
        this.categoryService.getAllCategories().subscribe({
            next: (data) => {
                this.categories.set(data);
                this.isLoading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading.set(false);
                this.handleApiError(err, 'Failed to fetch categories');
            }
        });
    }

    openNew(): void {
        this.category = { name: '' };
        this.nameSubmitted = false;
        this.categoryDialog = true;
    }

    editCategory(cat: CategoryResponse): void {
        this.category = { ...cat };
        this.nameSubmitted = false;
        this.categoryDialog = true;
    }

    saveCategory(): void {
        this.nameSubmitted = true;
        const trimmedName = this.category.name ? this.category.name.trim() : '';

        // --- 1. Frontend Form Validation ---
        if (!trimmedName) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Warning',
                detail: 'Category name cannot be empty.',
                life: 4000
            });
            return;
        }

        if (trimmedName.length < 3 || trimmedName.length > 50) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Warning',
                detail: 'Category name must be between 3 and 50 characters.',
                life: 4000
            });
            return;
        }

        this.isSaving.set(true);
        const payload = { name: trimmedName };

        // --- 2. Create or Update Execution ---
        if (this.category.id) {
            this.categoryService.updateCategory(this.category.id, payload).subscribe({
                next: (updatedCat) => {
                    this.isSaving.set(false);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Category Updated',
                        detail: `Category was updated successfully.`,
                        life: 3000
                    });
                    this.hideDialog();
                    this.loadCategories();
                },
                error: (err: HttpErrorResponse) => {
                    this.isSaving.set(false);
                    this.handleApiError(err, 'Could not update category.');
                }
            });
        } else {
            this.categoryService.createCategory(payload).subscribe({
                next: (createdCat) => {
                    this.isSaving.set(false);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Category Created',
                        detail: `Category "${createdCat.name}" added successfully.`,
                        life: 3000
                    });
                    this.hideDialog();
                    this.loadCategories();
                },
                error: (err: HttpErrorResponse) => {
                    this.isSaving.set(false);
                    this.handleApiError(err, 'Could not create category.');
                }
            });
        }
    }

    deleteCategory(cat: CategoryResponse): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${cat.name}"? This action cannot be undone.`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.categoryService.deleteCategory(cat.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'Category Deleted',
                            detail: `"${cat.name}" was successfully removed.`,
                            life: 3000
                        });
                        this.loadCategories();
                    },
                    error: (err: HttpErrorResponse) => {
                        this.handleApiError(err, 'Failed to delete category.');
                    }
                });
            }
        });
    }

    // --- 3. Enhanced Centralized HTTP Error Handler ---
    private handleApiError(error: HttpErrorResponse, fallbackMsg: string): void {
        let summary = 'Error';
        let detail = fallbackMsg;

        if (error.status === 400) {
            summary = 'Bad Request';
            detail = error.error?.message || 'Invalid form data sent to backend.';
        } else if (error.status === 409) {
            summary = 'Conflict';
            detail = error.error?.message || 'A category with this name already exists.';
        } else if (error.status === 401 || error.status === 403) {
            summary = 'Unauthorized';
            detail = 'You do not have permission to perform this action.';
        } else if (error.status === 500) {
            summary = 'Server Error';
            detail = 'An internal server error occurred. Please try again later.';
        } else if (error.status === 0) {
            summary = 'Connection Failed';
            detail = 'Unable to connect to backend server. Check network connection.';
        }

        this.messageService.add({
            severity: 'error',
            summary: summary,
            detail: detail,
            life: 5000
        });
    }

    hideDialog(): void {
        this.categoryDialog = false;
        this.category = { name: '' };
        this.nameSubmitted = false;
    }
}
