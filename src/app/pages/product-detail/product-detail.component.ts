import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { Product, ProductVariant } from '../../model/product.model';
import { ProductsService } from '../../services/products.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TagModule,
        ToastModule,
        RouterLink
    ],
    providers: [MessageService],
    templateUrl: './product-detail.component.html',
    styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private productService = inject(ProductsService);
    private messageService = inject(MessageService);

    readonly backendHost = environment.backendHost || 'http://localhost:8080';

    product = signal<Product | null>(null);
    isLoading = signal<boolean>(true);

    // Active View Selections
    selectedImage = signal<string>('');
    selectedColor = signal<string>('');
    selectedStorage = signal<string>('');
    selectedVariant = signal<ProductVariant | null>(null);

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.fetchProductDetail(+idParam);
        }
    }

    fetchProductDetail(id: number): void {
        this.isLoading.set(true);
        this.productService.getProductById(id).subscribe({
            next: (data: Product) => {
                this.product.set(data);

                // Set main image as active viewer image
                const defaultImage = data.mainImageUrl || (data.imageUrls && data.imageUrls[0]) || '';
                this.selectedImage.set(defaultImage);

                // Pre-select first variant options if available
                if (data.variants && data.variants.length > 0) {
                    this.selectColor(data.variants[0].color);
                    this.selectStorage(data.variants[0].storage);
                }

                this.isLoading.set(false);
            },
            error: (_err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load product details.'
                });
                this.isLoading.set(false);
            }
        });
    }

    getImageUrl(url: string | undefined): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        return `${this.backendHost}${cleanPath}`;
    }

    get availableColors(): { color: string; hex?: string }[] {
        const variants = this.product()?.variants || [];
        const unique = new Map<string, string | undefined>();
        variants.forEach(v => {
            if (!unique.has(v.color)) {
                unique.set(v.color, v.colorHex);
            }
        });
        return Array.from(unique.entries()).map(([color, hex]) => ({ color, hex }));
    }

    get availableStorages(): string[] {
        const variants = this.product()?.variants || [];
        return Array.from(new Set(variants.map(v => v.storage)));
    }

    selectColor(color: string): void {
        this.selectedColor.set(color);
        this.updateVariantSelection();
    }

    selectStorage(storage: string): void {
        this.selectedStorage.set(storage);
        this.updateVariantSelection();
    }

    updateVariantSelection(): void {
        const variants = this.product()?.variants || [];
        const match = variants.find(
            v => v.color === this.selectedColor() && v.storage === this.selectedStorage()
        );
        this.selectedVariant.set(match || null);
    }

    get computedPrice(): number {
        const base = this.product()?.price || 0;
        const adjustment = this.selectedVariant()?.priceAdjustment || 0;
        return base + adjustment;
    }
}
