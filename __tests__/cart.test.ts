import { addToCart, getCart, clearCart, CartItem } from '../lib/cart';

describe('cart utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds an item to an empty cart and stores it in localStorage', () => {
    const item = { id: 1, name: 'Test', price: 'Rs 100', img: '/test.png' };

    const dispatched: string[] = [];
    const originalDispatch = window.dispatchEvent;
    window.dispatchEvent = (event: Event) => {
      dispatched.push(event.type);
      return true;
    };

    const cart = addToCart(item);

    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ ...item, qty: 1 });

    const stored = getCart();
    expect(stored).toEqual(cart);
    expect(dispatched).toContain('cartUpdated');
    expect(dispatched).toContain('cartAdded');

    window.dispatchEvent = originalDispatch;
  });

  it('increments qty when adding the same item twice', () => {
    const item = { id: 1, name: 'Test', price: 'Rs 100', img: '/test.png' };
    addToCart(item);
    addToCart(item);

    const cart = getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(2);
  });

  it('clears the cart', () => {
    const item = { id: 1, name: 'Test', price: 'Rs 100', img: '/test.png' };
    addToCart(item);
    expect(getCart()).toHaveLength(1);

    clearCart();
    expect(getCart()).toHaveLength(0);
  });
});
