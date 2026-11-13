const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
  /\/$/,
  ""
);

export type AdminUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
};

export type BannerItem = {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  publicId?: string;
  linkTarget?: "sell" | "search" | "chats" | "none" | "custom";
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type AdminListingDetail = {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  price: number;
  negotiable?: boolean;
  condition?: string;
  status: string;
  images?: Array<{ _id?: string; url: string; publicId?: string; sortOrder?: number }>;
  attributes?: Record<string, unknown>;
  location?: {
    city?: string;
    locality?: string;
    state?: string;
    coordinates?: { type?: string; coordinates?: number[] };
  };
  category?: {
    _id?: string;
    name?: string;
    slug?: string;
    icon?: string;
    isPending?: boolean;
    isActive?: boolean;
    attributes?: Array<{
      key?: string;
      label?: string;
      type?: string;
      options?: string[];
    }>;
  };
  seller?: {
    _id?: string;
    name?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
    isPhoneVerified?: boolean;
    createdAt?: string;
  };
  views?: number;
  isFeatured?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  rejectionReason?: string;
  reviewedAt?: string | null;
  reviewedBy?: { name?: string; email?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryItem = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  iconPublicId?: string;
  level?: number;
  isPending?: boolean;
  isActive?: boolean;
  parent?: { _id?: string; name?: string } | null;
  requestedBy?: { name?: string; phone?: string; email?: string } | null;
  sortOrder?: number;
  createdAt: string;
};

export type ManagedUser = {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  isBlocked?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_refresh_token");
}

export function setAdminSession(
  accessToken: string,
  user: AdminUser,
  refreshToken?: string
) {
  localStorage.setItem("admin_access_token", accessToken);
  localStorage.setItem("admin_user", JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem("admin_refresh_token", refreshToken);
  }
}

export function clearAdminSession() {
  localStorage.removeItem("admin_access_token");
  localStorage.removeItem("admin_refresh_token");
  localStorage.removeItem("admin_user");
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("admin_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  clearAdminSession();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.accessToken) return false;
        localStorage.setItem("admin_access_token", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("admin_refresh_token", data.refreshToken);
        }
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function adminRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
    formData?: FormData;
    _retried?: boolean;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (!options.formData) headers["Content-Type"] = "application/json";
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method:
      options.method ||
      (options.body || options.formData ? "POST" : "GET"),
    headers,
    body: options.formData
      ? options.formData
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (
    res.status === 401 &&
    options.auth !== false &&
    !options._retried
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return adminRequest<T>(path, { ...options, _retried: true });
    }
    redirectToLogin();
    throw new Error(data.message || "Invalid or expired token");
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function adminLogin(email: string, password: string) {
  return adminRequest<{
    success: boolean;
    user: AdminUser;
    accessToken: string;
    refreshToken: string;
  }>("/api/v1/admin/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export async function fetchStats() {
  return adminRequest<{
    success: boolean;
    stats: {
      pendingListings: number;
      activeListings: number;
      rejectedListings: number;
      pendingCategories: number;
      users: number;
    };
  }>("/api/v1/admin/stats");
}

export async function fetchAdminListings(status = "pending", page = 1) {
  return adminRequest<{
    success: boolean;
    items: Array<{
      _id: string;
      title: string;
      price: number;
      status: string;
      images?: Array<{ url: string }>;
      location?: { city?: string; locality?: string };
      category?: { name?: string; icon?: string; isPending?: boolean };
      seller?: { name?: string; phone?: string; email?: string };
      createdAt: string;
      rejectionReason?: string;
    }>;
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/api/v1/admin/listings?status=${encodeURIComponent(status)}&page=${page}`);
}

export async function fetchAdminListing(id: string) {
  return adminRequest<{ success: boolean; listing: AdminListingDetail }>(
    `/api/v1/admin/listings/${id}`
  );
}

export async function approveListing(id: string) {
  return adminRequest(`/api/v1/admin/listings/${id}/approve`, { method: "POST" });
}

export async function rejectListing(id: string, reason: string) {
  return adminRequest(`/api/v1/admin/listings/${id}/reject`, {
    method: "POST",
    body: { reason },
  });
}

export async function fetchAdminCategories(pending = true) {
  return adminRequest<{ success: boolean; items: CategoryItem[] }>(
    `/api/v1/admin/categories?pending=${pending ? "true" : "false"}`
  );
}

export async function createCategory(payload: {
  name: string;
  parentId?: string;
  icon?: string;
  sortOrder?: number;
}) {
  return adminRequest<{ success: boolean; category: CategoryItem }>(
    "/api/v1/admin/categories",
    { method: "POST", body: payload }
  );
}

export async function updateCategory(
  id: string,
  payload: Partial<{
    name: string;
    icon: string;
    iconPublicId: string;
    sortOrder: number;
    isActive: boolean;
  }>
) {
  return adminRequest<{ success: boolean; category: CategoryItem }>(
    `/api/v1/admin/categories/${id}`,
    { method: "PATCH", body: payload }
  );
}

export async function uploadCategoryIcon(id: string, file: File) {
  const form = new FormData();
  form.append("image", file);
  return adminRequest<{
    success: boolean;
    category: CategoryItem;
    imageUrl: string;
    publicId: string;
  }>(`/api/v1/admin/categories/${id}/icon`, {
    method: "POST",
    formData: form,
  });
}

export async function deleteCategory(id: string) {
  return adminRequest(`/api/v1/admin/categories/${id}`, { method: "DELETE" });
}

export async function approveCategory(id: string) {
  return adminRequest(`/api/v1/admin/categories/${id}/approve`, { method: "POST" });
}

export async function mergeCategory(id: string, targetCategoryId: string) {
  return adminRequest(`/api/v1/admin/categories/${id}/merge`, {
    method: "POST",
    body: { targetCategoryId },
  });
}

export async function fetchActiveCategories() {
  return adminRequest<{
    success: boolean;
    categories: Array<{
      _id: string;
      name: string;
      children?: Array<{ _id: string; name: string }>;
    }>;
  }>("/api/v1/categories", { auth: false });
}

export async function fetchAdminBanners() {
  return adminRequest<{ success: boolean; items: BannerItem[] }>(
    "/api/v1/admin/banners"
  );
}

export async function createBanner(payload: Partial<BannerItem>) {
  return adminRequest<{ success: boolean; banner: BannerItem }>(
    "/api/v1/admin/banners",
    { method: "POST", body: payload }
  );
}

export async function updateBanner(id: string, payload: Partial<BannerItem>) {
  return adminRequest<{ success: boolean; banner: BannerItem }>(
    `/api/v1/admin/banners/${id}`,
    { method: "PATCH", body: payload }
  );
}

export async function deleteBanner(id: string) {
  return adminRequest(`/api/v1/admin/banners/${id}`, { method: "DELETE" });
}

export async function uploadBannerImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  return adminRequest<{ success: boolean; imageUrl: string; publicId: string }>(
    "/api/v1/admin/banners/upload",
    { method: "POST", formData: form }
  );
}

export async function fetchAdminUsers(q = "", page = 1) {
  const qs = new URLSearchParams({ page: String(page) });
  if (q) qs.set("q", q);
  return adminRequest<{
    success: boolean;
    items: ManagedUser[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/api/v1/admin/users?${qs.toString()}`);
}

export async function setUserBlocked(id: string, isBlocked: boolean) {
  return adminRequest<{ success: boolean; user: ManagedUser }>(
    `/api/v1/admin/users/${id}/block`,
    { method: "POST", body: { isBlocked } }
  );
}

export type SupportConversation = {
  _id: string;
  type?: "listing" | "support";
  lastMessageAt?: string;
  lastMessageText?: string;
  buyerUnread?: number;
  sellerUnread?: number;
  buyer?: {
    _id?: string;
    name?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  };
  seller?: {
    _id?: string;
    name?: string;
    role?: string;
  };
};

export type SupportMessage = {
  _id: string;
  text?: string;
  type?: "text" | "image";
  imageUrl?: string;
  createdAt: string;
  sender?: {
    _id?: string;
    name?: string;
    avatarUrl?: string;
  };
};

export async function fetchSupportConversations() {
  return adminRequest<{ success: boolean; items: SupportConversation[] }>(
    "/api/v1/conversations?type=support"
  );
}

export async function fetchSupportMessages(id: string) {
  return adminRequest<{
    success: boolean;
    items: SupportMessage[];
  }>(`/api/v1/conversations/${id}/messages?limit=50`);
}

export async function sendSupportMessage(id: string, text: string) {
  return adminRequest<{ success: boolean; message: SupportMessage }>(
    `/api/v1/conversations/${id}/messages`,
    { method: "POST", body: { text, type: "text" } }
  );
}

export async function markSupportRead(id: string) {
  return adminRequest(`/api/v1/conversations/${id}/read`, { method: "PATCH" });
}
