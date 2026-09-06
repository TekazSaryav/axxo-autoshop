export interface Variant {
  id: number;
  product_id: number;
  name: string;
  price: string;
  stock: number | null; // null or -1 = unlimited, 0 = out of stock
  description?: string | null;
}

export interface Product {
  id: number;
  name: string;
  path?: string;
  description: string;
  price?: string | null;
  currency: string;
  sort_priority?: number | null;
  category?: {
    id: number;
    name: string;
    path: string;
    order?: number;
  } | null;
  images: Array<{
    id: number;
    url: string;
  }>;
  variants: Variant[];
  stock_count: number | null;
  deliverables_type?: string;
}

export interface Category {
  id: number;
  name: string;
  order?: number;
  count: number;
}

export interface CartItem {
  product: Product;
  variant: Variant;
  quantity: number;
}

export interface ShopInfo {
  id: number;
  name: string;
  url: string;
  currency: string;
  logo_url: string | null;
  payment_methods: Array<{
    id: number;
    type: string;
    name: string;
    checkout_name: string;
    is_active: boolean;
    icon_image_url?: string | null;
  }>;
}

export interface SavedOrder {
  invoiceId: number | string;
  url: string;
  email: string;
  date: string;
  total: number;
  currency: string;
  items: Array<{
    title: string;
    variant: string;
    quantity: number;
  }>;
  status: string;
  delivered?: string | null;
  instructions?: string | null;
}

export interface TelegramWebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramWebAppUser;
    auth_date?: string;
    hash?: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
  sendData: (data: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
