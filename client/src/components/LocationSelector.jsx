import { useState } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLocation } from "@/context/LocationContext";
import {
  COUNTRIES,
  getCities,
  getStates,
} from "@/data/locations";
import { inputClass } from "@/components/FormField";

const PIN_PATTERN = /^\d{6}$/;

/** Header delivery-location picker: country, state, city and PIN code. */
const LocationSelector = ({ className = "" }) => {
  const { t } = useTranslation();
  const { location, isLocationSet, saveLocation } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(location);
  const [error, setError] = useState("");

  const open = () => {
    setForm(location);
    setError("");
    setIsOpen(true);
  };

  const setField = (field) => (e) => {
    const value = e.target.value;
    setError("");
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "state" ? { city: "" } : {}),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.state) return setError("Please select a state");
    if (!form.city) return setError("Please select a city");
    if (!PIN_PATTERN.test(form.pincode.trim()))
      return setError("Enter a valid 6-digit PIN code");
    await saveLocation({
      country: form.country,
      state: form.state,
      city: form.city,
      pincode: form.pincode.trim(),
    });
    setIsOpen(false);
    toast.success(
      `${t("location.deliverTo")} ${form.city}, ${form.state} ${form.pincode.trim()}`,
    );
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={t("location.label")}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-full border border-border bg-secondary/50 hover:border-primary transition-colors text-steel hover:text-primary max-w-[180px]"
      >
        <MapPin className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium truncate">
          {isLocationSet
            ? `${location.city} ${location.pincode}`
            : t("location.selectLocation")}
        </span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label={t("common.close")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full pt-2 z-50">
            <form
              onSubmit={handleSave}
              className="w-[290px] bg-card/95 backdrop-blur-lg border border-border rounded-xl p-4 space-y-3 card-shadow"
              role="dialog"
              aria-label={t("location.label")}
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {t("location.label")}
              </p>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  {t("location.country")}
                </span>
                <select value={form.country} onChange={setField("country")} className={inputClass}>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  {t("location.state")}
                </span>
                <select value={form.state} onChange={setField("state")} className={inputClass}>
                  <option value="">Select state</option>
                  {getStates(form.country).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  {t("location.city")}
                </span>
                <select
                  value={form.city}
                  onChange={setField("city")}
                  disabled={!form.state}
                  className={`${inputClass} disabled:opacity-50`}
                >
                  <option value="">Select city</option>
                  {getCities(form.country, form.state).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  {t("location.pincode")}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pincode: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder={t("location.pincodePlaceholder")}
                  className={inputClass}
                />
              </label>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 gradient-neon text-primary-foreground py-2.5 text-xs font-semibold uppercase tracking-widest rounded-full neon-glow inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t("location.updateLocation")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest rounded-full border border-border hover:border-destructive hover:text-destructive transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                We currently deliver within India.
              </p>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default LocationSelector;
