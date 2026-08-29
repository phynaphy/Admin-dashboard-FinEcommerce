import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { User } from '../../model/user.model';
import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        ToastModule,
        AvatarModule,
        DialogModule,
        DropdownModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
    private userService = inject(UserService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private fb = inject(FormBuilder);

    readonly backendHost = environment.backendHost || 'http://localhost:8080';

    users = signal<User[]>([]);
    isLoading = signal<boolean>(true);

    userDialog = signal<boolean>(false);
    isEditMode = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);
    selectedUserId: number | null = null;

    roleOptions = [
        { label: 'USER', value: 'USER' },
        { label: 'ADMIN', value: 'ADMIN' }
    ];

    userForm: FormGroup = this.fb.group({
        fullName: ['', [Validators.required]],
        username: [''],
        email: ['', [Validators.required, Validators.email]],
        password: [''],
        confirmPassword: [''],
        role: ['USER', [Validators.required]]
    });

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.isLoading.set(true);
        this.userService.getUsers().subscribe({
            next: (data: User[]) => {
                this.users.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch user list'
                });
                this.isLoading.set(false);
            }
        });
    }

    deleteUser(user: User): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete user "${user.username}"?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-secondary p-button-text',
            accept: () => {
                this.userService.deleteUser(user.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: 'User deleted successfully'
                        });
                        this.loadUsers();
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err.error?.message || 'Failed to delete user'
                        });
                    }
                });
            }
        });
    }

    openCreateModal(): void {
        this.isEditMode.set(false);
        this.selectedUserId = null;
        this.userForm.reset({ role: 'USER' });

        this.userForm.get('username')?.setValidators([Validators.required]);
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.userForm.get('confirmPassword')?.setValidators([Validators.required]);
        this.userForm.get('username')?.updateValueAndValidity();
        this.userForm.get('password')?.updateValueAndValidity();
        this.userForm.get('confirmPassword')?.updateValueAndValidity();

        this.userDialog.set(true);
    }

    openEditModal(user: User): void {
        this.isEditMode.set(true);
        this.selectedUserId = user.id;

        this.userForm.get('username')?.clearValidators();
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('confirmPassword')?.clearValidators();
        this.userForm.get('username')?.updateValueAndValidity();
        this.userForm.get('password')?.updateValueAndValidity();
        this.userForm.get('confirmPassword')?.updateValueAndValidity();

        this.userForm.patchValue({
            fullName: user.fullName,
            email: user.email,
            role: user.role
        });

        this.userDialog.set(true);
    }

    saveUser(): void {
        if (this.userForm.invalid) {
            this.userForm.markAllAsTouched();
            return;
        }

        const formValue = this.userForm.value;

        if (!this.isEditMode()) {
            if (formValue.password !== formValue.confirmPassword) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'Passwords do not match'
                });
                return;
            }
        }

        this.isSubmitting.set(true);

        if (this.isEditMode() && this.selectedUserId) {
            const updatePayload = {
                fullName: formValue.fullName,
                email: formValue.email,
                role: formValue.role
            };

            this.userService.updateUser(this.selectedUserId, updatePayload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully' });
                    this.userDialog.set(false);
                    this.isSubmitting.set(false);
                    this.loadUsers();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to update user' });
                    this.isSubmitting.set(false);
                }
            });
        } else {
            this.userService.createUser(formValue).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User created successfully' });
                    this.userDialog.set(false);
                    this.isSubmitting.set(false);
                    this.loadUsers();
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to create user' });
                    this.isSubmitting.set(false);
                }
            });
        }
    }

    getAvatarUrl(url: string | null): string | null {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${this.backendHost}${cleanPath}`;
    }

    getInitials(name: string, username: string): string {
        const target = name?.trim() ? name : username;
        return target ? target.slice(0, 2).toUpperCase() : 'U';
    }
}
