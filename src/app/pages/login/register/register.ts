import { Component, inject, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [Button, FormsModule, IconField, InputIcon, InputText],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  backgroundImage = './assets/img/1_6book.jpg';
  isLoading = signal(false);
  errorMessage = signal('');

  // Matching your JSON structure exactly
  credentials = {
    name: '',
    username: '',
    password: '',
    role: 'USER' // Default role as per your JSON
  };

  onSignUp() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Navigate to login after successful registration
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Registration failed. Try a different username.';
        this.errorMessage.set(msg);
        console.error('Signup failed:', err);
      }
    });
  }
}
