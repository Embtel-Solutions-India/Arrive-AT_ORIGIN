import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiUrl } from "../utils/api";

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
}

interface PortalSession {
  _id: string;
  bookingNumber: string;
  packageName: string;
  meetingType: string;
  sessionsCount: number;
  price: number;
  currency: string;
  appointmentDate: string;
  appointmentTime: string;
  meetingMode: string;
  notes?: string;
  paymentStatus: string;
  status: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

interface PortalOrder {
  _id: string;
  orderNumber: string;
  total: number;
  currency: string;
  paymentStatus: string;
  orderStatus: string;
  items: Array<{
    title: string;
    format?: string;
    price: number;
    quantity: number;
    coverImage?: string;
  }>;
  shippingAddress?: Record<string, string>;
  createdAt: string;
}

interface PortalData {
  customer: CustomerProfile | null;
  sessions: PortalSession[];
  orders: PortalOrder[];
  stats: {
    sessionsCount: number;
    ordersCount: number;
    totalSpent: number;
  };
}

interface CustomerAuthContextValue {
  customer: CustomerProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  portalData: PortalData | null;
  loading: boolean;
  login: (email: string, password?: string, name?: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<void>;
  autoLogin: (customer: CustomerProfile, token: string) => void;
  logout: () => void;
  refreshPortal: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

const STORAGE_TOKEN_KEY = "soulbody_client_token";
const STORAGE_USER_KEY = "soulbody_client_user";

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      if (typeof window !== "undefined") {
        const isResetPath = window.location.pathname.includes("reset-password");
        const params = new URLSearchParams(window.location.search);
        const isResetMode = params.get("mode") === "reset";
        const urlToken = params.get("token") || params.get("customerToken");
        if (urlToken && !isResetPath && !isResetMode) {
          localStorage.setItem(STORAGE_TOKEN_KEY, urlToken);
          return urlToken;
        }
      }
    } catch {
      // ignore
    }
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  });

  const [customer, setCustomer] = useState<CustomerProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPortalData = async (activeToken: string) => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/public/customer/portal"), {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPortalData(json.data);
        if (json.data.customer) {
          setCustomer(json.data.customer);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(json.data.customer));
        }
      } else if (res.status === 401 || res.status === 403) {
        // Clear invalid or expired credentials
        setToken(null);
        setCustomer(null);
        setPortalData(null);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    } catch {
      // Ignore background refresh errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortalData(token);
    }
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isResetPath = window.location.pathname.includes("reset-password");
    const params = new URLSearchParams(window.location.search);
    const isResetMode = params.get("mode") === "reset";
    const urlToken = params.get("token") || params.get("customerToken");
    if (urlToken && !isResetPath && !isResetMode && urlToken !== token) {
      setToken(urlToken);
      localStorage.setItem(STORAGE_TOKEN_KEY, urlToken);
    }
  }, []);

  const login = async (email: string, password?: string, name?: string) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/public/customer/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Unable to sign in");
      }

      const receivedToken = json.data.token;
      const receivedCustomer = json.data.customer;

      setToken(receivedToken);
      setCustomer(receivedCustomer);
      localStorage.setItem(STORAGE_TOKEN_KEY, receivedToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(receivedCustomer));

      await fetchPortalData(receivedToken);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: { name: string; email: string; password: string; phone?: string }) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/public/customer/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Unable to create account");
      }

      const receivedToken = json.data.token;
      const receivedCustomer = json.data.customer;

      setToken(receivedToken);
      setCustomer(receivedCustomer);
      localStorage.setItem(STORAGE_TOKEN_KEY, receivedToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(receivedCustomer));

      await fetchPortalData(receivedToken);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/public/customer/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to process forgot password request");
      }
      return json.message || "If an account exists, a reset link has been dispatched to your email.";
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetToken: string, newPassword: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/public/customer/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Unable to reset password");
      }

      const receivedToken = json.data.token;
      const receivedCustomer = json.data.customer;

      setToken(receivedToken);
      setCustomer(receivedCustomer);
      localStorage.setItem(STORAGE_TOKEN_KEY, receivedToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(receivedCustomer));

      await fetchPortalData(receivedToken);
    } finally {
      setLoading(false);
    }
  };

  const autoLogin = (newCustomer: CustomerProfile, newToken: string) => {
    setToken(newToken);
    setCustomer(newCustomer);
    localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newCustomer));
    fetchPortalData(newToken);
  };

  const logout = () => {
    setToken(null);
    setCustomer(null);
    setPortalData(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  };

  const refreshPortal = async () => {
    if (token) {
      await fetchPortalData(token);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        isAuthenticated: !!token && !!customer,
        portalData,
        loading,
        login,
        signup,
        forgotPassword,
        resetPassword,
        autoLogin,
        logout,
        refreshPortal,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return ctx;
}
