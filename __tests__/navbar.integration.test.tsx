import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import Navbar from '../app/component/navbar';

// Mocks for next/navigation
const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/',
}));

// Minimal mocks for firebase auth and toast
jest.mock('@/lib/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: any, callback: (user: any) => void) => {
    callback(null);
    return () => void 0;
  },
  signOut: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Navbar integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
  });

  it('renders cart count based on localStorage and updates on cart events', async () => {
    // preload cart with 2 items (qty 1 each)
    window.localStorage.setItem(
      'opulentia_cart',
      JSON.stringify([{ id: 1, qty: 1 }, { id: 2, qty: 1 }])
    );

    render(<Navbar />);

    const cartButton = screen.getByTitle('Cart');
    expect(cartButton).toBeInTheDocument();

    // The badge should display 2 (sum of qty)
    expect(within(cartButton).getByText('2')).toBeInTheDocument();

    // Update cart and dispatch event; badge should update
    window.localStorage.setItem(
      'opulentia_cart',
      JSON.stringify([{ id: 1, qty: 3 }])
    );

    await act(async () => {
      window.dispatchEvent(new Event('cartUpdated'));
    });

    expect(within(cartButton).getByText('3')).toBeInTheDocument();
  });

  it('shows a popup when cartAdded event is dispatched', async () => {
    render(<Navbar />);

    const productName = 'Golden Chair';

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('cartAdded', { detail: { name: productName } })
      );
    });

    // Popup should display the added product name in uppercase
    expect(screen.getByText(productName.toUpperCase())).toBeInTheDocument();
  });

  it('navigates to visualization when 3D Visualization button is clicked', () => {
    render(<Navbar />);
    const button = screen.getByRole('button', { name: /3D Visualization/i });
    fireEvent.click(button);
    expect(pushMock).toHaveBeenCalledWith('/Visualization');
  });
});
