/**
 * Server components talk to the API directly; the browser uses a same-origin
 * path (proxied by the Next rewrite) unless an absolute public URL is set.
 */
const SERVER_API_BASE =
  process.env.API_URL ??
  process.env.BUILD_API_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://127.0.0.1:3001");

const CLIENT_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

const API_BASE =
  typeof window === "undefined" ? SERVER_API_BASE : CLIENT_API_BASE;

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export async function api<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, ...fetchOpts } = options;
  const headers: HeadersInit = {
    ...fetchOpts.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    // Public catalog reads opt into ISR via `next.revalidate`; everything else
    // (auth, cart, orders, admin) must always hit the API.
    ...(fetchOpts.cache || fetchOpts.next ? {} : { cache: "no-store" as RequestCache }),
    ...fetchOpts,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string | string[];
      error?: string;
    };
    const message = Array.isArray(body.message)
      ? body.message.join("؛ ")
      : body.message;
    throw new ApiError(
      res.status,
      message ?? body.error ?? `درخواست ناموفق بود: ${res.status}`,
    );
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

export interface ProductImageBrief {
  id: string;
  url: string;
  alt: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  price: number;
  compareAt: number | null;
  sku: string;
  stock: number;
  woodType: string | null;
  finish: string | null;
  dimensions: string | null;
  weightKg: number | null;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  category: Category;
  images: (ProductImage | ProductImageBrief)[];
  rating: RatingSummary;
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

// Catalog and blog data is safe to cache briefly; reviews stay uncached because
// they change with moderation and appear in interactive client components.
const PUBLIC_REVALIDATE = 60;
const BLOG_REVALIDATE = 300;

export async function getCategories(): Promise<Category[]> {
  return api<Category[]>("/catalog/categories", {
    next: { revalidate: PUBLIC_REVALIDATE },
  });
}

export async function getFacets(): Promise<CatalogFacets> {
  return api<CatalogFacets>("/catalog/facets", {
    next: { revalidate: PUBLIC_REVALIDATE },
  });
}

export async function getProducts(params: {
  search?: string;
  category?: string;
  woodType?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "rating" | "name";
  limit?: number;
  offset?: number;
}): Promise<ProductListResponse> {
  const u = new URLSearchParams();
  if (params.search) u.set("search", params.search);
  if (params.category) u.set("category", params.category);
  if (params.woodType) u.set("woodType", params.woodType);
  if (params.featured !== undefined)
    u.set("featured", String(params.featured));
  if (params.minPrice !== undefined)
    u.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined)
    u.set("maxPrice", String(params.maxPrice));
  if (params.sort) u.set("sort", params.sort);
  if (params.limit) u.set("limit", String(params.limit));
  if (params.offset !== undefined) u.set("offset", String(params.offset));
  const qs = u.size ? `?${u.toString()}` : "";
  return api<ProductListResponse>(`/catalog/products${qs}`, {
    next: { revalidate: PUBLIC_REVALIDATE },
  });
}

export async function getProductBySlug(
  slug: string,
): Promise<Product> {
  return api<Product>(`/catalog/products/${slug}`, {
    next: { revalidate: PUBLIC_REVALIDATE },
  });
}

export async function getRelatedProducts(
  slug: string,
): Promise<Product[]> {
  return api<Product[]>(`/catalog/products/${slug}/related`, {
    next: { revalidate: PUBLIC_REVALIDATE },
  });
}

export interface CreateProductInput {
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  price: number;
  compareAt?: number;
  sku: string;
  stock: number;
  categoryId: string;
  woodType?: string;
  finish?: string;
  dimensions?: string;
  weightKg?: number;
  featured?: boolean;
  isActive?: boolean;
  images?: string[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

export async function createProduct(
  token: string | null,
  dto: CreateProductInput,
): Promise<Product> {
  return api<Product>("/catalog/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

export async function updateProduct(
  token: string | null,
  id: string,
  dto: UpdateProductInput,
): Promise<Product> {
  return api<Product>(`/catalog/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

export async function deleteProduct(
  token: string | null,
  id: string,
): Promise<{ success: boolean }> {
  return api<{ success: boolean }>(`/catalog/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export async function createCategory(
  token: string | null,
  dto: CreateCategoryInput,
): Promise<Category> {
  return api<Category>("/catalog/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

export async function updateCategory(
  token: string | null,
  id: string,
  dto: UpdateCategoryInput,
): Promise<Category> {
  return api<Category>(`/catalog/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

export async function deleteCategory(
  token: string | null,
  id: string,
): Promise<{ success: boolean }> {
  return api<{ success: boolean }>(`/catalog/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface CartItemProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  lineTotal: number;
  product: CartItemProduct;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
  summary: CartSummary;
}

function cartHeaders(sessionId?: string): Record<string, string> {
  return sessionId ? { "x-cart-session": sessionId } : {};
}

export async function getCart(
  sessionId?: string,
  token?: string | null,
): Promise<Cart> {
  return api<Cart>("/cart", { headers: cartHeaders(sessionId), token });
}

export async function addCartItem(
  productId: string,
  quantity?: number,
  sessionId?: string,
  token?: string | null,
): Promise<Cart> {
  return api<Cart>("/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...cartHeaders(sessionId) },
    body: JSON.stringify({ productId, quantity }),
    token,
  });
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
  sessionId?: string,
  token?: string | null,
): Promise<Cart> {
  return api<Cart>(`/cart/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...cartHeaders(sessionId) },
    body: JSON.stringify({ quantity }),
    token,
  });
}

export async function removeCartItem(
  itemId: string,
  sessionId?: string,
  token?: string | null,
): Promise<Cart> {
  return api<Cart>(`/cart/items/${itemId}`, {
    method: "DELETE",
    headers: cartHeaders(sessionId),
    token,
  });
}

export async function clearCart(
  sessionId?: string,
  token?: string | null,
): Promise<Cart> {
  return api<Cart>("/cart", {
    method: "DELETE",
    headers: cartHeaders(sessionId),
    token,
  });
}

export async function mergeCart(
  sessionId: string,
  token?: string | null,
): Promise<Cart> {
  return api<Cart>("/cart/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
    token,
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
}

export interface AuthResult {
  user: AuthUser;
}

export async function register(dto: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<AuthResult> {
  return api<AuthResult>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function login(credentials: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return api<AuthResult>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export interface SendOtpResult {
  success: boolean;
  message: string;
  code?: string;
  expiresInSeconds: number;
}

export async function sendOtp(identifier: string): Promise<SendOtpResult> {
  return api<SendOtpResult>("/auth/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
}

export async function verifyOtp(dto: {
  identifier: string;
  code: string;
  name?: string;
}): Promise<AuthResult> {
  return api<AuthResult>("/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function getCurrentUser(token?: string | null): Promise<AuthUser> {
  return api<AuthUser>("/auth/me", { token });
}

export async function logout(): Promise<{ success: boolean }> {
  return api<{ success: boolean }>("/auth/logout", { method: "POST" });
}

export async function updateProfile(
  token: string | null,
  dto: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
  },
): Promise<AuthUser> {
  return api<AuthUser>("/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

export async function changePassword(
  token: string | null,
  dto: { currentPassword: string; newPassword: string },
): Promise<{ success: boolean; user: AuthUser }> {
  return api<{ success: boolean; user: AuthUser }>("/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  customerName: string;
  subtotal: number;
  shipping: number;
  total: number;
  note: string | null;
  paymentGateway?: string | null;
  paymentRefId?: string | null;
  paidAt?: string | null;
  shippingAddress: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export async function createOrder(
  token: string | null,
  dto: {
    shippingAddress: Record<string, unknown>;
    saveAddress?: boolean;
    note?: string;
  },
): Promise<Order> {
  return api<Order>("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

// ---------------------------------------------------------------------------
// Payment Gateways (Zarinpal & Zibal)
// ---------------------------------------------------------------------------

export interface GatewayInfo {
  id: string;
  name: string;
  logo: string;
  isLive: boolean;
  isConfigured: boolean;
  isAvailable: boolean;
  description: string;
}

export interface InitiatePaymentResult {
  paymentUrl: string;
  trackId: string;
  gateway: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  isSimulated: boolean;
}

export interface VerifyPaymentResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  refId?: string;
  cardPan?: string;
  paidAt?: string;
  errorMessage?: string;
}

export async function getPaymentGateways(): Promise<GatewayInfo[]> {
  return api<GatewayInfo[]>("/payment/gateways");
}

export async function initiatePayment(
  token: string | null,
  dto: { orderId: string; gateway: string; callbackUrl?: string },
): Promise<InitiatePaymentResult> {
  return api<InitiatePaymentResult>("/payment/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

export async function verifyPayment(dto: {
  gateway: string;
  trackId: string;
  status?: string;
  success?: string;
}): Promise<VerifyPaymentResult> {
  return api<VerifyPaymentResult>("/payment/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function getOrders(token?: string | null): Promise<Order[]> {
  return api<Order[]>("/orders", { token });
}

export async function getOrder(
  token: string | null,
  id: string,
): Promise<Order> {
  return api<Order>(`/orders/${id}`, { token });
}

export async function cancelOrder(
  token: string | null,
  id: string,
): Promise<{ id: string; orderNumber: string; status: string; updatedAt: string }> {
  return api(`/orders/${id}/cancel`, { method: "POST", token });
}

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<{ id: string; orderNumber: string; status: string; updatedAt: string }> {
  return api(`/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface ReviewUser {
  name: string;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string;
  approved?: boolean;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
}

export interface ReviewListResponse {
  product: { id: string; name: string };
  rating: RatingSummary;
  reviews: Review[];
}

export async function getProductReviews(
  productId: string,
): Promise<ReviewListResponse> {
  return api<ReviewListResponse>(`/reviews/product/${productId}`);
}

export async function createReview(
  productId: string,
  token: string | null,
  dto: { rating: number; title?: string; body: string },
): Promise<Review> {
  return api<Review>(`/reviews/product/${productId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export interface BlogAuthor {
  name: string;
  avatarUrl: string | null;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string | null;
  tags: string[];
  published: boolean;
  authorId: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author?: BlogAuthor;
}

export interface BlogListResponse {
  items: BlogPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getBlogPosts(params: {
  page?: number;
  tag?: string;
  q?: string;
}): Promise<BlogListResponse> {
  const u = new URLSearchParams();
  if (params.page) u.set("page", String(params.page));
  if (params.tag) u.set("tag", params.tag);
  if (params.q) u.set("q", params.q);
  const qs = u.size ? `?${u.toString()}` : "";
  return api<BlogListResponse>(`/blog${qs}`, {
    next: { revalidate: BLOG_REVALIDATE },
  });
}

export async function getBlogTags(): Promise<string[]> {
  return api<string[]>("/blog/tags", {
    next: { revalidate: BLOG_REVALIDATE },
  });
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<{ post: BlogPost; related: BlogPost[] }> {
  return api<{ post: BlogPost; related: BlogPost[] }>(`/blog/${slug}`, {
    next: { revalidate: BLOG_REVALIDATE },
  });
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export interface ContactTicket {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  userId: string | null;
  createdAt: string;
}

export interface ContactListResponse {
  items: ContactTicket[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function submitContact(dto: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; id: string }> {
  return api<{ success: boolean; id: string }>("/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export async function getContactTickets(
  token: string | null,
  params: { status?: string; page?: number },
): Promise<ContactListResponse> {
  const u = new URLSearchParams();
  if (params.status) u.set("status", params.status);
  if (params.page) u.set("page", String(params.page));
  const qs = u.size ? `?${u.toString()}` : "";
  return api<ContactListResponse>(`/contact${qs}`, { token });
}

export async function updateContactStatus(
  id: string,
  status: string,
): Promise<{ id: string; subject: string; status: string }> {
  return api(`/contact/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface AdminSummary {
  revenue: number;
  paidOrders: number;
  pendingReviews: number;
  newTickets: number;
  customers: number;
  products: number;
  ordersByStatus: Record<OrderStatus, number>;
  salesByDay: { date: string; total: number; orders: number }[];
  lowStock: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    image: string | null;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    email: string;
    status: OrderStatus;
    total: number;
    createdAt: string;
  }[];
}

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  note: string | null;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderList {
  items: AdminOrderRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AdminReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  createdAt: string;
  user: { name: string; email: string };
  product: { id: string; name: string; slug: string; image: string | null };
}

export interface AdminReviewList {
  items: AdminReviewRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getAdminSummary(): Promise<AdminSummary> {
  return api<AdminSummary>("/admin/summary");
}

export async function getAdminOrders(params: {
  status?: string;
  search?: string;
  page?: number;
}): Promise<AdminOrderList> {
  const u = new URLSearchParams();
  if (params.status) u.set("status", params.status);
  if (params.search) u.set("search", params.search);
  if (params.page) u.set("page", String(params.page));
  const qs = u.size ? `?${u.toString()}` : "";
  return api<AdminOrderList>(`/admin/orders${qs}`);
}

export async function getAdminReviews(params: {
  status?: "all" | "pending" | "approved";
  page?: number;
}): Promise<AdminReviewList> {
  const u = new URLSearchParams();
  if (params.status) u.set("status", params.status);
  if (params.page) u.set("page", String(params.page));
  const qs = u.size ? `?${u.toString()}` : "";
  return api<AdminReviewList>(`/admin/reviews${qs}`);
}

export async function setReviewApproval(
  id: string,
  approved: boolean,
): Promise<{ id: string; approved: boolean; updatedAt: string }> {
  return api(`/reviews/${id}/approval`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved }),
  });
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export async function getAddresses(token?: string | null): Promise<Address[]> {
  return api<Address[]>("/addresses", { token });
}

export async function createAddress(
  token: string | null,
  dto: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  },
): Promise<Address> {
  return api<Address>("/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

export async function updateAddress(
  token: string | null,
  id: string,
  dto: {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  },
): Promise<Address> {
  return api<Address>(`/addresses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
    token,
  });
}

export async function deleteAddress(
  token: string | null,
  id: string,
): Promise<{ success: boolean }> {
  return api<{ success: boolean }>(`/addresses/${id}`, {
    method: "DELETE",
    token,
  });
}
