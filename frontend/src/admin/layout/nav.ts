export interface NavItem {
  label: string;
  to: string;
  permission?: string;
  badge?: string;
}

export interface NavGroup {
  id: string;
  label?: string;
  icon?: string;
  items: NavItem[];
}

export const adminNav: NavGroup[] = [
  {
    id: "dashboard",
    items: [{ label: "Dashboard", to: "/admin/dashboard" }],
  },
  {
    id: "blog",
    label: "Blog CMS",
    icon: "✍️",
    items: [
      { label: "All Posts", to: "/admin/blog", permission: "BLOG_READ" },
      { label: "Add New Post", to: "/admin/blog/new", permission: "BLOG_WRITE" },
      { label: "Categories", to: "/admin/blog/categories", permission: "BLOG_READ" },
      { label: "Tags", to: "/admin/blog/tags", permission: "BLOG_READ" },
    ],
  },
  {
    id: "books",
    label: "Book Store",
    icon: "📚",
    items: [
      { label: "All Books", to: "/admin/books", permission: "PRODUCT_READ" },
      { label: "Add New Book", to: "/admin/books/new", permission: "PRODUCT_WRITE" },
      { label: "Book Categories", to: "/admin/books/categories", permission: "PRODUCT_READ" },
      { label: "Authors", to: "/admin/authors", permission: "BLOG_READ" },
      { label: "Inventory", to: "/admin/books/inventory", permission: "PRODUCT_READ" },
    ],
  },
  {
    id: "orders",
    label: "Orders & Sales",
    icon: "🛍️",
    items: [
      { label: "All Orders", to: "/admin/orders", permission: "ORDER_READ" },
      { label: "Customers", to: "/admin/customers", permission: "CUSTOMER_READ" },
      { label: "Payments", to: "/admin/payments", permission: "PAYMENT_READ" },
      { label: "Coupons", to: "/admin/coupons", permission: "ORDER_READ" },
    ],
  },
  {
    id: "system",
    label: "Assets & System",
    icon: "⚙️",
    items: [
      { label: "Media Library", to: "/admin/media", permission: "MEDIA_READ" },
      { label: "SEO Management", to: "/admin/seo", permission: "SETTINGS_MANAGE" },
      { label: "Settings", to: "/admin/settings", permission: "SETTINGS_MANAGE" },
      { label: "Admin Users", to: "/admin/users", permission: "USER_MANAGE" },
    ],
  },
];
