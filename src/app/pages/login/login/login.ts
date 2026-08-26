import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, Button, InputText, IconField, InputIcon, Toast, PasswordModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [MessageService],
})
export class Login {
  backgroundImage = './assets/img/ecommerce.jpg';
    showPassword = false;
  credentials = {
    username: '',
    password: '',
  };

  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  isLoading = signal(false);

  onLogin() {
    this.isLoading.set(true);

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Login Successful',
          life: 1000,
        });
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMessage = err?.error?.message || 'Invalid username or password';
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: errorMessage,
          life: 3000,
        });
        console.error('Login failed', err);
      },
    });
  }
}
