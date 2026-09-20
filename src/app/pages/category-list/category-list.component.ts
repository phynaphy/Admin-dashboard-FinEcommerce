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

export interface CategoryModel {
    id?: number;
    name: string;
    code?: string;
    imageUrl?: string;
    totalProducts?: number;
}

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

    backendHost: string = 'http://localhost:8080';

    categoryDialog: boolean = false;
    category: CategoryModel = this.getEmptyCategory();

    selectedFile: File | null = null;
    imagePreview: string | null = null;
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

    getImageUrl(url: string | undefined): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${this.backendHost}${cleanPath}`;
    }

    private getEmptyCategory(): CategoryModel {
        return {
            name: '',
            code: '',
            imageUrl: '',
            totalProducts: 0
        };
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
        this.category = this.getEmptyCategory();
        this.selectedFile = null;
        this.imagePreview = null;
        this.nameSubmitted = false;
        this.categoryDialog = true;
    }

    editCategory(cat: CategoryResponse): void {
        this.category = { ...cat };
        this.selectedFile = null;
        this.imagePreview = cat.imageUrl ? this.getImageUrl(cat.imageUrl) : null;
        this.nameSubmitted = false;
        this.categoryDialog = true;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.selectedFile = input.files[0];
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(this.selectedFile);
        }
    }

    removeSelectedImage(): void {
        this.selectedFile = null;
        this.imagePreview = null;
        this.category.imageUrl = '';
    }

    saveCategory(): void {
        this.nameSubmitted = true;
        const trimmedName = this.category.name ? this.category.name.trim() : '';

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

        // Build Multipart Form Data matching Postman specs
        const formData = new FormData();
        formData.append('name', trimmedName);

        if (this.category.code) {
            formData.append('code', this.category.code.trim());
        }

        if (this.selectedFile) {
            formData.append('imageUrl', this.selectedFile);
        }

        if (this.category.id) {
            this.categoryService.updateCategory(this.category.id, formData).subscribe({
                next: () => this.handleSaveSuccess('Updated'),
                error: (err: HttpErrorResponse) => {
                    this.isSaving.set(false);
                    this.handleApiError(err, 'Could not update category.');
                }
            });
        } else {
            this.categoryService.createCategory(formData).subscribe({
                next: (createdCat) => this.handleSaveSuccess('Created', createdCat.name),
                error: (err: HttpErrorResponse) => {
                    this.isSaving.set(false);
                    this.handleApiError(err, 'Could not create category.');
                }
            });
        }
    }

    private handleSaveSuccess(action: string, name?: string): void {
        this.isSaving.set(false);
        this.messageService.add({
            severity: 'success',
            summary: `Category ${action}`,
            detail: name ? `Category "${name}" added successfully.` : `Category updated successfully.`,
            life: 3000
        });
        this.hideDialog();
        this.loadCategories();
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
        this.category = this.getEmptyCategory();
        this.selectedFile = null;
        this.imagePreview = null;
        this.nameSubmitted = false;
    }
}
