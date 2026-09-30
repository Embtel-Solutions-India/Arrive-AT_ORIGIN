export interface NavItem {
  label: string;
  to: string;
  permission?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const adminNav: NavGroup[] = [
  { items: [{ label: "Dashboard", to: "/admin/dashboard" }] },
  {
    label: "Content",
    items: [
      { label: "Pages", to: "/admin/pages", permission: "BLOG_READ" },
      { label: "Blog Posts", to: "/admin/blog", permission: "BLOG_READ" },
      { label: "Categories", to: "/admin/blog/categories", permission: "BLOG_READ" },
      { label: "Media", to: "/admin/media", permission: "BLOG_READ" },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Books", to: "/admin/products", permission: "PRODUCT_READ" },
      { label: "Categories", to: "/admin/products/categories", permission: "PRODUCT_READ" },
      { label: "Inventory", to: "/admin/inventory", permission: "PRODUCT_READ" },
      { label: "Orders", to: "/admin/orders", permission: "ORDER_READ" },
      { label: "Coupons", to: "/admin/coupons", permission: "ORDER_READ" },
    ],
  },
  {
    label: "Consultations",
    items: [
      { label: "Services", to: "/admin/consultations", permission: "BOOKING_READ" },
      { label: "Bookings", to: "/admin/bookings", permission: "BOOKING_READ" },
      { label: "Calendar", to: "/admin/calendar", permission: "BOOKING_READ" },
      { label: "Availability", to: "/admin/availability", permission: "BOOKING_READ" },
    ],
  },
  { items: [{ label: "Customers", to: "/admin/customers", permission: "ORDER_READ" }] },
  {
    label: "Payments",
    items: [
      { label: "Transactions", to: "/admin/payments", permission: "PAYMENT_READ" },
      { label: "Refunds", to: "/admin/payments/refunds", permission: "PAYMENT_READ" },
    ],
  },
  {
    items: [
      { label: "Analytics", to: "/admin/analytics", permission: "PAYMENT_READ" },
      { label: "Users & Roles", to: "/admin/users", permission: "USER_MANAGE" },
      { label: "Settings", to: "/admin/settings", permission: "SETTINGS_MANAGE" },
    ],
  },
];
