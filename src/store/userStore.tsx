import { create } from 'zustand';

interface UserInfo {
  token: null;
  user_id: number;
  user_name: string;
  email: string;
  pro_member: boolean;
}

interface Payment {
  payment_id: number;
  timestamp: string;
  price: number;
  order_id: string;
  plan: string;
}

interface UserState {
  userInfo: UserInfo | null;
  payments: Payment[];
  loading: boolean;
  status: string;
  setUserInfo: (userInfo: UserInfo | null) => void;
  setPayments: (payments: Payment[]) => void;
  setLoading: (loading: boolean) => void;
  setStatus: (status: string) => void;
  fetchUserData: (sub: string, signal?: AbortSignal) => Promise<void>;
  fetchPaymentRecords: (sub: string, signal?: AbortSignal) => Promise<void>;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  payments: [],
  loading: false,
  status: '',
  setUserInfo: (userInfo) => set({ userInfo }),
  setPayments: (payments) => set({ payments }),
  setLoading: (loading) => set({ loading }),
  setStatus: (status) => set({ status }),
  fetchUserData: async (sub: string, signal?: AbortSignal) => {
    try {
      set({ loading: true });
      const response = await fetch('http://localhost:5000/get-user-info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Google-Sub': sub,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      set({ userInfo: data.user });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('User info fetch aborted');
        return;
      }
      console.error('Error fetching user data:', error);
      set({ status: `Error: ${error instanceof Error ? error.message : 'Failed to load user data'}` });
    } finally {
      set({ loading: false });
    }
  },
  fetchPaymentRecords: async (sub: string, signal?: AbortSignal) => {
    try {
      set({ loading: true });
      const response = await fetch('http://localhost:5000/get-payment-records', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Google-Sub': sub,
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      set({
        payments: data.payments,
        status: data.payments.length === 0 ? 'No payment records found' : '',
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Payment records fetch aborted');
        return;
      }
      console.error('Error fetching payment records:', error);
      set({
        status: `Error: ${error instanceof Error ? error.message : 'Failed to load payment records'}`,
      });
    } finally {
      set({ loading: false });
    }
  },
  clearUserData: () => set({ userInfo: null, payments: [], status: '', loading: false }),
}));