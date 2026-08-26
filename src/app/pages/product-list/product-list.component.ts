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

    products = signal<Product[]>([]);
    isLoading = signal<boolean>(true);

    // Dialog & Form State
    productDialog = false;
    product: Partial<Product> = {};

    ngOnInit(): void {
        this.loadProducts();
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

    // openNew(): void {
    //     this.product = {};
    //     this.productDialog = true;
    // }
    //
    // editProduct(product: Product): void {
    //     // Clone object to avoid mutating table data directly before saving
    //     this.product = { ...product };
    //     this.productDialog = true;
    // }

    hideDialog(): void {
        this.productDialog = false;
    }

    // saveProduct(): void {
    //     if (!this.product.name || this.product.price === undefined) {
    //         this.messageService.add({
    //             severity: 'warn',
    //             summary: 'Warning',
    //             detail: 'Please fill in required fields'
    //         });
    //         return;
    //     }
    //
    //     if (this.product.id) {
    //         // Update Existing Product
    //         this.productService.updateProduct(this.product.id, this.product).subscribe({
    //             next: () => {
    //                 this.messageService.add({
    //                     severity: 'success',
    //                     summary: 'Successful',
    //                     detail: 'Product Updated'
    //                 });
    //                 this.productDialog = false;
    //                 this.loadProducts();
    //             },
    //             error: (err) => {
    //                 this.messageService.add({
    //                     severity: 'error',
    //                     summary: 'Error',
    //                     detail: err?.error?.message || 'Failed to update product'
    //                 });
    //             }
    //         });
    //     } else {
    //         // Create New Product
    //         this.productService.createProduct(this.product).subscribe({
    //             next: () => {
    //                 this.messageService.add({
    //                     severity: 'success',
    //                     summary: 'Successful',
    //                     detail: 'Product Created'
    //                 });
    //                 this.productDialog = false;
    //                 this.loadProducts();
    //             },
    //             error: (err) => {
    //                 this.messageService.add({
    //                     severity: 'error',
    //                     summary: 'Error',
    //                     detail: err?.error?.message || 'Failed to create product'
    //                 });
    //             }
    //         });
    //     }
    // }

    deleteProduct(product: Product): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${product.name}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.productService.deleteProduct(product.id).subscribe({
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

    getSeverity(quantity: number): 'success' | 'warn' | 'danger' {
        if (quantity > 20) return 'success';
        if (quantity > 0) return 'warn';
        return 'danger';
    }

    selectedFile: File | null = null;
    imagePreview: string | null = null;

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;

            // Generate preview URL
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
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
        this.imagePreview = null;
        this.productDialog = true;
    }

    saveProduct(): void {
        if (!this.product.name || this.product.price === undefined) {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in required fields' });
            return;
        }

        // Construct FormData payload
        const formData = new FormData();
        formData.append('product', new Blob([JSON.stringify(this.product)], { type: 'application/json' }));

        if (this.selectedFile) {
            formData.append('file', this.selectedFile);
        }

        const request$ = this.product.id
            ? this.productService.updateProductWithImage(this.product.id, formData)
            : this.productService.createProductWithImage(formData);

        request$.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Product Saved' });
                this.productDialog = false;
                this.loadProducts();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save product' });
            }
        });
    }
}
