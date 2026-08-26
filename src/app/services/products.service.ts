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


    list(){
        return this.http.get<any>(`${this.baseUrl}/list`);
    }

    getProducts(): Observable<Product[]> {
        return this.http.get<Product[]>(`${this.baseUrl}`);
    }

    getProductById(id: number): Observable<Product> {
        return this.http.get<Product>(`${this.baseUrl}/${id}`);
    }

    createProduct(product: Partial<Product>): Observable<Product> {
        return this.http.post<Product>(this.baseUrl, product);
    }

    updateProduct(id: number, product: Partial<Product>): Observable<Product> {
        return this.http.put<Product>(`${this.baseUrl}/${id}`, product);
    }

    deleteProduct(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
    }

    createProductWithImage(formData: FormData): Observable<Product> {
        // Angular automatically sets 'multipart/form-data' boundary header when passing FormData
        return this.http.post<Product>(`${this.baseUrl}/api/admin/products`, formData);
    }

    updateProductWithImage(id: number, formData: FormData): Observable<Product> {
        return this.http.put<Product>(`${this.baseUrl}/api/admin/products/${id}`, formData);
    }

}
