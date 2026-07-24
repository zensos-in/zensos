import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "../api/axios";
import { Subscription, PlanType } from "../types";
import { useAuth } from "./AuthContext";

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  purchaseSubscription: (planType: PlanType) => Promise<any>;
  verifyPurchase: (paymentData: any) => Promise<any>;
  dismissExpiredPopup: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, checkAuth } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshSubscription = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get("/subscriptions/my");
      setSubscription(response.data.subscription);
      // We can also trigger checkAuth to update the seller object in AuthContext if needed
      await checkAuth();
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshSubscription();
    } else {
      setSubscription(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const purchaseSubscription = async (planType: PlanType) => {
    const response = await api.post("/subscriptions/purchase", { planType });
    return response.data;
  };

  const verifyPurchase = async (paymentData: any) => {
    const response = await api.post("/subscriptions/verify", paymentData);
    await refreshSubscription();
    return response.data;
  };

  const dismissExpiredPopup = async () => {
    await api.post("/subscriptions/dismiss-popup");
    await checkAuth(); // refresh user.subscriptionExpiredPopupShown
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        refreshSubscription,
        purchaseSubscription,
        verifyPurchase,
        dismissExpiredPopup,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
