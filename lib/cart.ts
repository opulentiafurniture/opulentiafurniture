export type CartItem = {
  id: number | string;
  qty: number;
  name: string;
  price: string;
  img: string;
};

const CART_KEY = 'opulentia_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY) || '[]';
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function setCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
}

export function addToCart(item: Omit<CartItem, 'qty'>, qty = 1) {
  const cart = getCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.qty = (existing.qty || 1) + qty;
  } else {
    cart.push({ ...item, qty });
  }
  setCart(cart);
  window.dispatchEvent(new CustomEvent('cartAdded', { detail: { name: item.name } }));
  return cart;
}

export function clearCart() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cartUpdated'));
}
