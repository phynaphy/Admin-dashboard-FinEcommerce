import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { StepperModule } from 'primeng/stepper';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { Product, ProductVariant, ProductFeature } from '../../model/product.model';
import { CategoryResponse } from '../../model/category.model';
import { ProductsService } from '../../services/products.service';
import { environment } from '../../../environments/environment';

export interface LocalVariant extends ProductVariant {
    colorPickerValue?: string;
}

@Component({
    selector: 'app-product-create',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        ButtonModule,
        InputTextModule,
        StepperModule,
        DropdownModule,
        ToastModule,
        ColorPickerModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './product-create.component.html'
})
export class ProductCreateComponent implements OnInit {
    private productService = inject(ProductsService);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    readonly backendHost = environment.backendHost || 'http://localhost:8080';

    isEditMode = signal<boolean>(false);
    productId = signal<number | null>(null);
    categories = signal<CategoryResponse[]>([]);

    product: Partial<Product> = {
        isOfficialStore: false,
        rating: 5.0,
        reviewCount: 0
    };

    variants: LocalVariant[] = [];
    features: ProductFeature[] = [];

    selectedMainFile: File | null = null;
    mainImagePreview: string | null = null;

    selectedGalleryFiles: File[] = [];
    galleryPreviews: string[] = [];
    existingGalleryUrls: string[] = [];

    ngOnInit(): void {
        this.loadCategories();

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam && !isNaN(+idParam)) {
            this.isEditMode.set(true);
            this.productId.set(+idParam);
            this.loadProductDetail(+idParam);
        }
    }

    loadCategories(): void {
        this.productService.getAllCategories().subscribe({
            next: (data) => this.categories.set(data),
            error: (err) => console.error('Error fetching categories:', err)
        });
    }

    loadProductDetail(id: number): void {
        this.productService.getProductById(id).subscribe({
            next: (data: any) => {
                const categoryId = data.categoryId ?? (data as any).category?.id;

                this.product = {
                    ...data,
                    categoryId
                };

                this.variants = data.variants ? data.variants.map((v:any) => {
                    const rawHex = v.colorHex ? v.colorHex.replace('#', '') : '3b82f6';
                    return {
                        ...v,
                        colorHex: v.colorHex || '#3b82f6',
                        colorPickerValue: rawHex
                    };
                }) : [];

                this.features = data.features ? [...data.features] : [];
                this.mainImagePreview = data.mainImageUrl ? this.getImageUrl(data.mainImageUrl) : null;

                if (data.images && Array.isArray(data.images)) {
                    this.existingGalleryUrls = data.images.map((img: any) => this.getImageUrl(img.imageUrl || img));
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load product details.'
                });
            }
        });
    }

    getImageUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return `${this.backendHost}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    onColorPickerChange(variant: LocalVariant): void {
        if (variant.colorPickerValue) {
            variant.colorHex = `${variant.colorPickerValue}`;
        }
    }

    onHexInputChange(variant: LocalVariant): void {
        if (variant.colorHex) {
            variant.colorPickerValue = variant.colorHex.replace('#', '');
        }
    }

    addVariant(): void {
        this.variants.push({
            color: '',
            colorHex: '#3b82f6',
            colorPickerValue: '3b82f6',
            storage: '',
            stockQuantity: 0,
            priceAdjustment: 0
        });
    }

    removeVariant(index: number): void {
        this.variants.splice(index, 1);
    }

    addFeature(): void {
        this.features.push({
            featureKey: '',
            featureValue: ''
        });
    }

    removeFeature(index: number): void {
        this.features.splice(index, 1);
    }

    onMainFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedMainFile = input.files[0];
            const reader = new FileReader();
            reader.onload = () => (this.mainImagePreview = reader.result as string);
            reader.readAsDataURL(this.selectedMainFile);
        }
    }

    onGalleryFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const files = Array.from(input.files);
            this.selectedGalleryFiles.push(...files);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = () => this.galleryPreviews.push(reader.result as string);
                reader.readAsDataURL(file);
            });
        }
    }

    saveProduct(): void {
        if (!this.product.name || !this.product.categoryId || this.product.price === undefined) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Please fill in all required fields (Name, Category, Price).'
            });
            return;
        }

        const formData = new FormData();
        formData.append('product', new Blob([JSON.stringify({
            ...this.product,
            variants: this.variants.map(({ colorPickerValue, ...v }) => v),
            features: this.features
        })], { type: 'application/json' }));

        if (this.selectedMainFile) {
            formData.append('mainImage', this.selectedMainFile);
        }

        this.selectedGalleryFiles.forEach(file => {
            formData.append('galleryImages', file);
        });

        const request$ = this.isEditMode() && this.productId()
            ? this.productService.updateProduct(this.productId()!, formData)
            : this.productService.createProduct(formData);

        request$.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Product ${this.isEditMode() ? 'updated' : 'created'} successfully.`
                });
                setTimeout(() => this.router.navigate(['/admin/products']), 1200);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Failed to ${this.isEditMode() ? 'update' : 'create'} product.`
                });
            }
        });
    }
}
