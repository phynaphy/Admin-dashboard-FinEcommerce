import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryRequest, CategoryResponse } from '../model/category.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    // private readonly apiUrl = 'http://localhost:8080/api/v1/categories';
    readonly apiUrl = `${environment.baseUrl}/categories`;

    constructor(private http: HttpClient) {}

    getAllCategories(): Observable<CategoryResponse[]> {
        return this.http.get<CategoryResponse[]>(this.apiUrl);
    }

    getCategoryById(id: number): Observable<CategoryResponse> {
        return this.http.get<CategoryResponse>(`${this.apiUrl}/${id}`);
    }

    createCategory(formData: FormData): Observable<CategoryResponse> {
        return this.http.post<CategoryResponse>(this.apiUrl, formData);
    }

    updateCategory(id: number,formData: FormData): Observable<CategoryResponse> {
        return this.http.put<CategoryResponse>(`${this.apiUrl}/${id}`, formData);
    }

    deleteCategory(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
