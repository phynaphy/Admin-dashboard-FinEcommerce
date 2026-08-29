import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from '../model/product.model';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ProductsService {
    private http = inject(HttpClient);
    readonly baseUrl = `${environment.baseUrl}/admin/products`;

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(this.baseUrl);
    }

    getProductsByCategory(categoryId: number): Observable<Product[]> {
        return this.http.get<Product[]>(`${this.baseUrl}/category/${categoryId}`);
    }

    getProductById(id: number): Observable<Product> {
        return this.http.get<Product>(`${this.baseUrl}/${id}`);
    }

    createProduct(formData: FormData): Observable<Product> {
        return this.http.post<Product>(this.baseUrl, formData);
    }

    updateProduct(id: number, formData: FormData): Observable<Product> {
        return this.http.put<Product>(`${this.baseUrl}/${id}`, formData);
    }

    deleteProduct(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
