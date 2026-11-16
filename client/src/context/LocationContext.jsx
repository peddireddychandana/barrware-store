import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { DEFAULT_COUNTRY } from "@/data/locations";

const STORAGE_KEY = "barware-delivery-location";

const EMPTY_LOCATION = {
  country: DEFAULT_COUNTRY,
  state: "",
  city: "",
  pincode: "",
};

const readStoredLocation = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object"
      ? { ...EMPTY_LOCATION, ...parsed }
      : null;
  } catch {
    return null;
  }
};

const writeStoredLocation = (location) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    /* storage unavailable */
  }
};

const LocationContext = createContext(undefined);

/**
 * Delivery location for the storefront. Kept in localStorage for guests and, when
 * signed in, mirrored onto the customer profile address kept in MongoDB.
 */
export const LocationProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [location, setLocation] = useState(
    () => readStoredLocation() ?? EMPTY_LOCATION,
  );

  // Seed the selection from the customer's saved profile address on first visit.
  useEffect(() => {
    if (readStoredLocation() || !isLoggedIn) return;
    const profile = user?.address;
    if (profile?.city && profile?.state) {
      setLocation({
        country: DEFAULT_COUNTRY,
        state: profile.state,
        city: profile.city,
        pincode: profile.pincode || "",
      });
    }
  }, [isLoggedIn, user]);

  /**
   * Saves the selected delivery location locally and, for signed-in customers,
   * onto their profile address (city / state / pincode).
   */
  const saveLocation = useCallback(
    async (next) => {
      const normalized = { ...EMPTY_LOCATION, ...next };
      setLocation(normalized);
      writeStoredLocation(normalized);
      if (isLoggedIn) {
        try {
          await authService.updateProfile({
            address: {
              city: normalized.city,
              state: normalized.state,
              pincode: normalized.pincode,
            },
          });
        } catch {
          // Local selection still applies; profile sync can be retried later.
        }
      }
      return normalized;
    },
    [isLoggedIn],
  );

  const value = useMemo(
    () => ({
      location,
      isLocationSet: Boolean(location.city && location.state),
      saveLocation,
    }),
    [location, saveLocation],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
