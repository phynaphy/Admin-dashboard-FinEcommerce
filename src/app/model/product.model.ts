// export interface Product {
//     id: number;
//     name: string;
//     description: string;
//     price: number;
//     stockQuantity: number;
//     categoryId: number;
//     imageUrl?: any;
//
// }
export interface ProductVariant {
    id?: number;
    color: string;
    colorHex?: string;
    storage: string;
    priceAdjustment?: number;
    stockQuantity: number;
}

export interface ProductFeature {
    id?: number;
    featureKey: string;
    featureValue: string;
}

export interface Product {
    id?: number;
    name: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    rating?: number;
    reviewCount?: number;
    isOfficialStore?: boolean;
    mainImageUrl?: string;
    imageUrls?: string[];
    description?: string;
    categoryId: number;
    categoryName?: string;
    variants?: ProductVariant[];
    features?: ProductFeature[];
}
