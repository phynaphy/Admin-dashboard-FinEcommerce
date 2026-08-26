import { Component, inject, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { FormsModule } from '@angular/forms'; // Removed ReactiveFormsModule as you are using ngModel
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router'; // Added RouterLink
import { CommonModule } from '@angular/common';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Password } from 'primeng/password'; // Added for @if and other common directives

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  providers: [MessageService],
  imports: [Button, FormsModule, IconField, InputIcon, InputText, CommonModule, Toast, Password],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  backgroundImage = './assets/img/ecommerce.jpg';
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  isLoading = signal(false);

  credentials = {
    username: '',
    name: '',
    newPassword: '',
  };

  onForgotPassword() {
    if (!this.credentials.username || !this.credentials.newPassword) return;

    this.isLoading.set(true);

    this.authService.forgotPassword(this.credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password reset successfully!',
        });

        // Delay navigation so user can see the success message
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Verification failed. Please check your details.';

        this.messageService.add({
          severity: 'error',
          summary: 'Reset Failed',
          detail: msg,
        });
      },
    });
  }
}
