import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AuthService } from '../../services/auth.service';
import { Product } from '../../model/product.model';
import { ProductsService } from '../../services/products.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
    private productService = inject(ProductsService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    public authService = inject(AuthService);

    readonly backendHost = environment.backendHost || 'http://localhost:8080';

    products = signal<Product[]>([]);
    isLoading = signal<boolean>(true);

    productDialog = false;
    product: Partial<Product> = {};

    selectedFile: File | null = null;
    imagePreview: string | null = null;

    ngOnInit(): void {
        this.loadProducts();
    }

    getImageUrl(url: string | undefined): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${this.backendHost}${cleanPath}`;
    }

    loadProducts(): void {
        this.isLoading.set(true);
        this.productService.getProducts().subscribe({
            next: (data: Product[]): void => {
                this.products.set(data);
                this.isLoading.set(false);
            },
            error: (_err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch products'
                });
                this.isLoading.set(false);
            }
        });
    }

    openNew(): void {
        this.product = {};
        this.selectedFile = null;
        this.imagePreview = null;
        this.productDialog = true;
    }

    editProduct(product: Product): void {
        this.product = { ...product };
        this.selectedFile = null;
        // Show existing image as preview if available
        this.imagePreview = product.imageUrl ? this.getImageUrl(product.imageUrl) : null;
        this.productDialog = true;
    }

    hideDialog(): void {
        this.productDialog = false;
        this.selectedFile = null;
        this.imagePreview = null;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    saveProduct(): void {
        if (!this.product.name || this.product.price === undefined || !this.product.categoryId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please fill in required fields (Name, Price, Category ID)'
            });
            return;
        }

        const formData = new FormData();
        formData.append('name', this.product.name);
        formData.append('price', this.product.price.toString());
        formData.append('categoryId', this.product.categoryId.toString());

        if (this.product.description) {
            formData.append('description', this.product.description);
        }

        // FIX 1: Send 'stock' instead of 'stockQuantity' to match Spring DTO
        // if (this.product.stock !== undefined && this.product.stock !== null) {
        //     formData.append('stock', this.product.stock.toString());
        // }

        // FIX 2: Attach selected file using 'image' key matching Spring MultipartFile field
        if (this.selectedFile) {
            formData.append('imageUrl', this.selectedFile);
        }

        const request$ = this.product.id
            ? this.productService.updateProduct(this.product.id, formData)
            : this.productService.createProduct(formData);

        request$.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: this.product.id ? 'Product Updated' : 'Product Created'
                });
                this.hideDialog();
                this.loadProducts();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err?.error?.message || 'Failed to save product'
                });
            }
        });
    }

    deleteProduct(product: Product): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${product.name}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.productService.deleteProduct(product.id!).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Product Deleted'
                        });
                        this.loadProducts();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete product'
                        });
                    }
                });
            }
        });
    }

    getSeverity(quantity: number | null | undefined): 'success' | 'warn' | 'danger' {
        if (!quantity || quantity <= 0) return 'danger';
        if (quantity > 20) return 'success';
        return 'warn';
    }
}
