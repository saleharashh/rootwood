/**
 * Rootwood Group — Vite Static Frontend API Client
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem("craftedroot_token");
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem("craftedroot_token", token);
    else localStorage.removeItem("craftedroot_token");
  } catch {}
}

export function getCartSessionId(): string {
  try {
    let sid = localStorage.getItem("craftedroot_cart_session");
    if (!sid) {
      sid = "guest_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("craftedroot_cart_session", sid);
    }
    return sid;
  } catch {
    return "guest_fallback";
  }
}

export async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOpts } = options;
  const activeToken = token !== undefined ? token : getStoredToken();
  const sessionId = getCartSessionId();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Cart-Session": sessionId,
    ...(fetchOpts.headers as Record<string, string>),
  };

  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  if (fetchOpts.body && typeof fetchOpts.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOpts,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.message || body.error || `خطا در برقراری ارتباط (${res.status})`;
    throw new ApiError(res.status, Array.isArray(message) ? message.join("؛ ") : message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder?: number;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  name: string;
  tagline?: string | null;
  shortDescription?: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  compareAt?: number | null;
  sku?: string;
  stock: number;
  woodType: string | null;
  finish?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  weightKg?: number | null;
  featured?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: string;
  category?: { id: string; name: string; slug: string };
  imageUrl?: string;
  images?: ProductImage[];
  rating: number;
  ratingObj?: RatingSummary;
  reviewsCount: number;
  specs?: Record<string, string>;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CatalogFacets {
  woodTypes: string[];
  priceMin: number;
  priceMax: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  lineTotal: number;
  product: Product;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  freeShippingThreshold: number;
}

export interface CartView {
  id: string;
  items: CartItem[];
  summary: CartSummary;
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
}

export interface Address {
  id: string;
  userId?: string;
  recipientName: string;
  fullName?: string;
  phone: string;
  province: string;
  state?: string | null;
  city: string;
  street: string;
  line1?: string;
  line2?: string | null;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  name?: string;
  unitPrice: number;
  quantity: number;
  product?: {
    id: string;
    images?: { url: string }[];
  };
}

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  email?: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  street: string;
  postalCode?: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | string;
  subtotal: number;
  shipping: number;
  totalAmount: number;
  total?: number;
  shippingAddress?: Address;
  customerNote?: string | null;
  note?: string | null;
  paymentGateway?: string | null;
  paymentTrackId?: string | null;
  paymentRefId?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  user?: { name: string; email: string; phone?: string | null };
}

export interface Review {
  id: string;
  productId?: string;
  authorName: string;
  rating: number;
  title?: string | null;
  comment: string;
  isVerifiedPurchase: boolean;
  verifiedPurchase?: boolean;
  approved?: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  authorName: string;
  author?: { name: string };
  readingTimeMinutes?: number;
  tags: string[];
  publishedAt?: string;
  createdAt: string;
}

export interface AdminSummary {
  totalRevenue: number;
  revenue?: number;
  paidOrders: number;
  customers: number;
  openTickets?: number;
  ordersByStatus: Record<string, number>;
  salesByDay?: { day: string; total: number; count: number }[];
  lowStock?: { id: string; title: string; name?: string; sku?: string; stock: number; price: number }[];
}

export interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  isConfigured?: boolean;
  isLive?: boolean;
}

export type GatewayInfo = PaymentGateway;

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: "UNREAD" | "READ" | "REPLIED" | string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Unified API Callable & Methods
// ---------------------------------------------------------------------------

export interface ApiCallable {
  <T>(path: string, options?: FetchOptions): Promise<T>;

  // Catalog
  getProducts: (params?: Record<string, any>) => Promise<ProductListResponse>;
  getProductBySlug: (slug: string) => Promise<{ product: Product; related?: Product[] }>;
  getProductReviews: (productId: string) => Promise<{ reviews: Review[]; total: number }>;
  submitReview: (
    productId: string,
    data: { authorName: string; rating: number; comment: string; title?: string }
  ) => Promise<{ message: string; review?: Review }>;
  getCategories: () => Promise<{ categories: Category[] }>;
  getFacets: () => Promise<CatalogFacets>;

  // Orders
  getOrders: () => Promise<{ orders: Order[] }>;
  getOrder: (id: string) => Promise<{ order: Order }>;
  createOrder: (data: {
    shippingAddress: Partial<Address>;
    customerNote?: string;
    items: { productId: string; quantity: number }[];
  }) => Promise<{ order: Order }>;
  cancelOrder: (id: string) => Promise<{ message: string }>;

  // Payment
  getGateways: () => Promise<{ gateways: PaymentGateway[] }>;
  initiatePayment: (data: {
    orderId: string;
    gateway: string;
    callbackUrl?: string;
  }) => Promise<{ paymentUrl: string; trackId?: string; authority?: string }>;
  verifyPayment: (data: {
    orderId?: string;
    trackId?: string;
    authority?: string;
    status?: string;
    gateway?: string;
  }) => Promise<{ verified: boolean; message: string; refId?: string; trackId?: string; order?: Order }>;

  // Addresses
  getAddresses: () => Promise<{ addresses: Address[] }>;
  createAddress: (data: Partial<Address>) => Promise<{ address: Address }>;
  deleteAddress: (id: string) => Promise<{ message: string }>;

  // Security
  changePassword: (oldPass: string, newPass: string) => Promise<{ message: string }>;

  // Blog
  getBlogPosts: (params?: { tag?: string; search?: string; limit?: number; offset?: number }) => Promise<{ posts: BlogPost[]; total: number }>;
  getBlogPostBySlug: (slug: string) => Promise<{ post: BlogPost }>;
  getBlogTags: () => Promise<{ tags: string[] }>;

  // Contact
  submitContact: (data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) => Promise<{ message: string }>;

  // Admin
  getAdminSummary: () => Promise<AdminSummary>;
  getAdminOrders: (params?: { status?: string; limit?: number }) => Promise<{ orders: Order[] }>;
  updateOrderStatus: (orderId: string, status: string) => Promise<{ message: string }>;
  getAdminReviews: () => Promise<{ reviews: Review[] }>;
  updateReviewApproval: (reviewId: string, approved: boolean) => Promise<{ message: string }>;
  getAdminContacts: () => Promise<{ messages: ContactMessage[] }>;
  updateContactStatus: (id: string, status: string) => Promise<{ message: string }>;
  createProduct: (data: any) => Promise<{ product: Product }>;
}

const apiInstance = (async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  return request<T>(path, options);
}) as ApiCallable;

// Normalizing helper for Product
function normalizeProduct(p: any): Product {
  const title = p.title || p.name || "دست‌سازه چوبی";
  const name = p.name || title;
  const ratingNum = typeof p.rating === "number" ? p.rating : (p.rating?.average ?? 5);
  const ratingObj = typeof p.rating === "object" ? p.rating : { average: ratingNum, count: p.reviewsCount ?? 0 };
  const images = p.images || (p.imageUrl ? [{ id: "1", url: p.imageUrl, alt: title }] : []);

  return {
    ...p,
    title,
    name,
    shortDescription: p.shortDescription || p.tagline || (p.description ? p.description.slice(0, 150) : ""),
    originalPrice: p.originalPrice ?? p.compareAt ?? null,
    compareAt: p.compareAt ?? p.originalPrice ?? null,
    rating: ratingNum,
    ratingObj,
    reviewsCount: p.reviewsCount ?? ratingObj.count ?? 0,
    imageUrl: p.imageUrl || (images[0]?.url ?? "/images/placeholder.jpg"),
    images,
  };
}

// Normalizing helper for Order
function normalizeOrder(o: any): Order {
  const addr = o.shippingAddress || {};
  return {
    ...o,
    recipientName: o.recipientName || addr.recipientName || addr.fullName || "کاربر",
    phone: o.phone || addr.phone || "",
    province: o.province || addr.province || addr.state || "",
    city: o.city || addr.city || "",
    street: o.street || addr.street || addr.line1 || "",
    postalCode: o.postalCode || addr.postalCode || "",
    totalAmount: o.totalAmount ?? o.total ?? 0,
    total: o.total ?? o.totalAmount ?? 0,
    items: (o.items || []).map((it: any) => ({
      ...it,
      productTitle: it.productTitle || it.name || it.product?.title || it.product?.name || "اثر چوبی",
    })),
  };
}

// Normalizing helper for Address
function normalizeAddress(a: any): Address {
  return {
    ...a,
    recipientName: a.recipientName || a.fullName || "",
    fullName: a.fullName || a.recipientName || "",
    province: a.province || a.state || "",
    state: a.state || a.province || "",
    street: a.street || a.line1 || "",
    line1: a.line1 || a.street || "",
  };
}

// Normalizing helper for Review
function normalizeReview(r: any): Review {
  return {
    ...r,
    isVerifiedPurchase: !!(r.isVerifiedPurchase ?? r.verifiedPurchase),
    verifiedPurchase: !!(r.verifiedPurchase ?? r.isVerifiedPurchase),
  };
}

// Normalizing helper for BlogPost
function normalizeBlogPost(b: any): BlogPost {
  return {
    ...b,
    authorName: b.authorName || b.author?.name || "هنرمند کارگاه روت‌وود",
    tags: Array.isArray(b.tags) ? b.tags : [],
  };
}

// Attach catalog methods
apiInstance.getProducts = async (params = {}) => {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      query.set(k, String(v));
    }
  }
  const qs = query.toString();
  const res = await request<any>(`/products${qs ? `?${qs}` : ""}`);
  return {
    ...res,
    items: (res.items || []).map(normalizeProduct),
  };
};

apiInstance.getProductBySlug = async (slug: string) => {
  const res = await request<any>(`/products/${slug}`);
  return {
    product: normalizeProduct(res.product || res),
    related: (res.related || []).map(normalizeProduct),
  };
};

apiInstance.getProductReviews = async (productId: string) => {
  const res = await request<any>(`/products/${productId}/reviews`);
  return {
    ...res,
    reviews: (res.reviews || []).map(normalizeReview),
  };
};

apiInstance.submitReview = async (productId, data) => {
  return request(`/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

apiInstance.getCategories = async () => {
  const res = await request<any>("/categories");
  return { categories: Array.isArray(res) ? res : (res.categories || []) };
};

apiInstance.getFacets = async () => {
  return request("/catalog/facets");
};

// Attach order methods
apiInstance.getOrders = async () => {
  const res = await request<any>("/orders");
  return {
    ...res,
    orders: (res.orders || []).map(normalizeOrder),
  };
};

apiInstance.getOrder = async (id: string) => {
  const res = await request<any>(`/orders/${id}`);
  return { order: normalizeOrder(res.order) };
};

apiInstance.createOrder = async (data) => {
  const res = await request<any>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { order: normalizeOrder(res.order) };
};

apiInstance.cancelOrder = async (id: string) => {
  return request(`/orders/${id}/cancel`, { method: "POST" });
};

// Attach payment methods
apiInstance.getGateways = async () => {
  const res = await request<any>("/payment/gateways");
  return { gateways: Array.isArray(res) ? res : (res.gateways || []) };
};

apiInstance.initiatePayment = async (data) => {
  return request("/payment/initiate", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

apiInstance.verifyPayment = async (data) => {
  const res = await request<any>("/payment/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return {
    ...res,
    order: res.order ? normalizeOrder(res.order) : undefined,
  };
};

// Attach address methods
apiInstance.getAddresses = async () => {
  const res = await request<any>("/addresses");
  return {
    addresses: (res.addresses || []).map(normalizeAddress),
  };
};

apiInstance.createAddress = async (data) => {
  const res = await request<any>("/addresses", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { address: normalizeAddress(res.address) };
};

apiInstance.deleteAddress = async (id: string) => {
  return request(`/addresses/${id}`, { method: "DELETE" });
};

// Security
apiInstance.changePassword = async (oldPassword, newPassword) => {
  return request("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
};

// Blog
apiInstance.getBlogPosts = async (params = {}) => {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      query.set(k === "search" ? "q" : k, String(v));
    }
  }
  const qs = query.toString();
  const res = await request<any>(`/blog/posts${qs ? `?${qs}` : ""}`);
  const items = Array.isArray(res) ? res : (res.posts || res.items || []);
  return {
    posts: items.map(normalizeBlogPost),
    total: res.total ?? items.length,
  };
};

apiInstance.getBlogPostBySlug = async (slug: string) => {
  const res = await request<any>(`/blog/posts/${slug}`);
  return { post: normalizeBlogPost(res.post || res) };
};

apiInstance.getBlogTags = async () => {
  const res = await request<any>("/blog/tags");
  return { tags: Array.isArray(res) ? res : (res.tags || []) };
};

// Contact
apiInstance.submitContact = async (data) => {
  return request("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Admin
apiInstance.getAdminSummary = async () => {
  const res = await request<any>("/admin/summary");
  const lowStock = (res.lowStock || []).map((ls: any) => ({
    ...ls,
    title: ls.title || ls.name || "محصول",
  }));
  return {
    ...res,
    totalRevenue: res.totalRevenue ?? res.revenue ?? 0,
    revenue: res.revenue ?? res.totalRevenue ?? 0,
    lowStock,
  };
};

apiInstance.getAdminOrders = async (params = {}) => {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
  }
  const qs = query.toString();
  const res = await request<any>(`/admin/orders${qs ? `?${qs}` : ""}`);
  return {
    orders: (res.orders || []).map(normalizeOrder),
  };
};

apiInstance.updateOrderStatus = async (orderId, status) => {
  return request(`/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

apiInstance.getAdminReviews = async () => {
  const res = await request<any>("/admin/reviews");
  return {
    reviews: (res.reviews || []).map(normalizeReview),
  };
};

apiInstance.updateReviewApproval = async (reviewId, approved) => {
  return request(`/admin/reviews/${reviewId}/approval`, {
    method: "PATCH",
    body: JSON.stringify({ approved }),
  });
};

apiInstance.getAdminContacts = async () => {
  return request("/admin/contact");
};

apiInstance.updateContactStatus = async (id, status) => {
  return request(`/admin/contact/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

apiInstance.createProduct = async (data) => {
  const res = await request<any>("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { product: normalizeProduct(res.product) };
};

export const api = apiInstance;
export default api;
