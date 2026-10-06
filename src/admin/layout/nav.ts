export interface NavItem {
  label: string;
  to: string;
  permission?: string;
  badge?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const adminNav: NavGroup[] = [
  {
    items: [{ label: "Dashboard", to: "/admin/dashboard" }],
  },
  {
    label: "Blog CMS",
    items: [
      { label: "All Posts", to: "/admin/blog", permission: "BLOG_READ" },
      { label: "Add New Post", to: "/admin/blog/new", permission: "BLOG_WRITE" },
      { label: "Categories", to: "/admin/blog/categories", permission: "BLOG_READ" },
      { label: "Tags", to: "/admin/blog/tags", permission: "BLOG_READ" },
    ],
  },
  {
    label: "Book Store",
    items: [
      { label: "All Books", to: "/admin/books", permission: "PRODUCT_READ" },
      { label: "Add New Book", to: "/admin/books/new", permission: "PRODUCT_WRITE" },
      { label: "Book Categories", to: "/admin/books/categories", permission: "PRODUCT_READ" },
      { label: "Authors", to: "/admin/authors", permission: "BLOG_READ" },
      { label: "Inventory", to: "/admin/books/inventory", permission: "PRODUCT_READ" },
    ],
  },
  {
    label: "Orders & Sales",
    items: [
      { label: "All Orders", to: "/admin/orders", permission: "ORDER_READ" },
      { label: "Customers", to: "/admin/customers", permission: "CUSTOMER_READ" },
      { label: "Payments", to: "/admin/payments", permission: "PAYMENT_READ" },
    ],
  },
  {
    label: "Assets & System",
    items: [
      { label: "Media Library", to: "/admin/media", permission: "MEDIA_READ" },
      { label: "SEO Management", to: "/admin/seo", permission: "SETTINGS_MANAGE" },
      { label: "Settings", to: "/admin/settings", permission: "SETTINGS_MANAGE" },
      { label: "Admin Users", to: "/admin/users", permission: "USER_MANAGE" },
    ],
  },
];
