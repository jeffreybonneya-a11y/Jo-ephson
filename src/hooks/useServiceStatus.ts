import { useEffect, useState, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { getApiUrl } from "@/src/lib/api";
import {
  ALL_SERVICE_DEFINITIONS,
  ServiceAvailabilityStatus,
  ServiceId,
  ServiceStatusRecord,
  createDefaultServiceStatusMap,
  getServiceDefinition,
  getServiceIdForProduct,
} from "@/src/lib/serviceStatus";

interface ServiceStatusStoreState {
  statuses: Record<ServiceId, ServiceStatusRecord>;
  loading: boolean;
}

let storeState: ServiceStatusStoreState = {
  statuses: createDefaultServiceStatusMap(),
  loading: true,
};

let initialized = false;
let hasRealtimeSnapshot = false;
const listeners = new Set<(state: ServiceStatusStoreState) => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener(storeState);
  }
}

function initSharedServiceStatusListener() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  // 1. Initial REST fetch for fast bootstrap
  fetch(getApiUrl("/api/service-status"))
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (hasRealtimeSnapshot) return;
      if (ok && data?.success && data?.statuses) {
        const next = createDefaultServiceStatusMap();
        for (const def of ALL_SERVICE_DEFINITIONS) {
          const remote = data.statuses[def.id];
          if (remote) {
            next[def.id] = {
              serviceId: def.id,
              serviceName: remote.serviceName || def.name,
              description: def.description,
              status: remote.status === "out_of_stock" ? "out_of_stock" : "in_stock",
              updatedAt: remote.updatedAt,
              updatedBy: remote.updatedBy,
            };
          }
        }
        storeState = { statuses: next, loading: false };
        notifyListeners();
      } else {
        storeState = { ...storeState, loading: false };
        notifyListeners();
      }
    })
    .catch(() => {
      if (!hasRealtimeSnapshot) {
        storeState = { ...storeState, loading: false };
        notifyListeners();
      }
    });

  // 2. Authoritative real-time Firestore listener on `service_status`
  try {
    onSnapshot(
      collection(db, "service_status"),
      (snapshot) => {
        hasRealtimeSnapshot = true;
        const next = createDefaultServiceStatusMap();
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const sid = (data.serviceId || docSnap.id) as ServiceId;
          if (next[sid]) {
            next[sid] = {
              serviceId: sid,
              serviceName: data.serviceName || next[sid].serviceName,
              description: next[sid].description,
              status: data.status === "out_of_stock" ? "out_of_stock" : "in_stock",
              updatedAt: data.updatedAt,
              updatedBy: data.updatedBy,
            };
          }
        });
        storeState = { statuses: next, loading: false };
        notifyListeners();
      },
      (err) => {
        console.warn("[Service Status] Real-time listener notice:", err?.message || err);
        storeState = { ...storeState, loading: false };
        notifyListeners();
      }
    );
  } catch (err) {
    storeState = { ...storeState, loading: false };
    notifyListeners();
  }
}

export function useServiceStatus() {
  const [state, setState] = useState<ServiceStatusStoreState>(() => {
    initSharedServiceStatusListener();
    return storeState;
  });

  useEffect(() => {
    initSharedServiceStatusListener();
    const listener = (nextState: ServiceStatusStoreState) => {
      setState(nextState);
    };
    listeners.add(listener);
    // Sync immediately in case state updated between render and effect
    setState(storeState);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const getStatus = useCallback(
    (serviceId: ServiceId | null | undefined): ServiceAvailabilityStatus => {
      if (!serviceId) return "in_stock";
      return state.statuses[serviceId]?.status || "in_stock";
    },
    [state.statuses]
  );

  const isOutOfStock = useCallback(
    (serviceId: ServiceId | null | undefined): boolean => {
      if (!serviceId) return false;
      return state.statuses[serviceId]?.status === "out_of_stock";
    },
    [state.statuses]
  );

  const isInStock = useCallback(
    (serviceId: ServiceId | null | undefined): boolean => {
      return !isOutOfStock(serviceId);
    },
    [isOutOfStock]
  );

  const getServiceName = useCallback(
    (serviceId: ServiceId): string => {
      return state.statuses[serviceId]?.serviceName || getServiceDefinition(serviceId)?.name || serviceId;
    },
    [state.statuses]
  );

  const isProductOutOfStock = useCallback(
    (product?: Parameters<typeof getServiceIdForProduct>[0]): boolean => {
      const sid = getServiceIdForProduct(product);
      if (!sid) return false;
      return state.statuses[sid]?.status === "out_of_stock";
    },
    [state.statuses]
  );

  return {
    statuses: state.statuses,
    loading: state.loading,
    getStatus,
    isOutOfStock,
    isInStock,
    getServiceName,
    isProductOutOfStock,
    getServiceIdForProduct,
  };
}
