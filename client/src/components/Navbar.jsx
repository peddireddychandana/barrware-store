import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "@/components/AppLink";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Search,
  Package,
  LayoutDashboard,
  Heart,
  Home,
  Wine,
  BookOpen,
  Mail,
  Martini,
  CircleDot,
  UtensilsCrossed,
  Filter,
  Ruler,
  GlassWater,
  Beaker,
  Utensils,
  ChefHat,
  Snowflake,
  Droplets,
  Citrus,
  CupSoda,
  Layers,
  MapPin,
  Truck,
  LifeBuoy,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useLocation as useDeliveryLocation } from "@/context/LocationContext";
import CartDrawer from "./CartDrawer";
import Tooltip from "./ui/tooltip";
import LanguageSelector from "./LanguageSelector";
import LocationSelector from "./LocationSelector";

const NAV_ICONS = {
  Home,
  Shop: Wine,
  "Our Story": BookOpen,
  Contact: Mail,
};

const SUBMENU_ICONS = {
  Shakers: Martini,
  Openers: CircleDot,
  "Bar Tools": UtensilsCrossed,
  Strainers: Filter,
  Measuring: Ruler,
  Glassware: GlassWater,
  "Pitchers & Beakers": Beaker,
  Spoons: Utensils,
  "Prep Tools": ChefHat,
  "Ice Accessories": Snowflake,
  Pourers: Droplets,
  "Garnish & Prep": Citrus,
  Drinkware: CupSoda,
  "Build Your Bar Kit": Layers,
};

const navItems = [
  { label: "Home", href: "/" },
  {
    label: "Shop",
    href: "/products",
    submenu: [
      { label: "Shakers", href: "/category/shakers", icon: Martini },
      { label: "Openers", href: "/category/openers", icon: CircleDot },
      { label: "Bar Tools", href: "/category/bar-tools", icon: UtensilsCrossed },
      { label: "Strainers", href: "/category/strainers", icon: Filter },
      { label: "Measuring", href: "/category/measuring", icon: Ruler },
      { label: "Glassware", href: "/category/glassware", icon: GlassWater },
      { label: "Pitchers & Beakers", href: "/category/pitchers-beakers", icon: Beaker },
      { label: "Spoons", href: "/category/spoons", icon: Utensils },
      { label: "Prep Tools", href: "/category/prep-tools", icon: ChefHat },
      { label: "Ice Accessories", href: "/category/ice-accessories", icon: Snowflake },
      { label: "Pourers", href: "/category/pourers", icon: Droplets },
      { label: "Garnish & Prep", href: "/category/garnish-prep", icon: Citrus },
      { label: "Drinkware", href: "/category/drinkware", icon: CupSoda },
      { label: "Build Your Bar Kit", href: "/bar-kit", icon: Layers },
    ],
  },
  { label: "Our Story", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { t } = useTranslation();
  const { cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, isLoggedIn, isAdmin, logout, openLoginModal } = useAuth();
  const { isLocationSet } = useDeliveryLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const translateNavLabel = (label) => {
    const keys = {
      Home: "nav.home",
      Shop: "nav.shop",
      "Our Story": "nav.ourStory",
      Contact: "nav.contact",
      Shakers: "categories.shakers",
      Openers: "categories.openers",
      "Bar Tools": "categories.barTools",
      Strainers: "categories.strainers",
      Measuring: "categories.measuring",
      Glassware: "categories.glassware",
      "Pitchers & Beakers": "categories.pitchersBeakers",
      Spoons: "categories.spoons",
      "Prep Tools": "categories.prepTools",
      "Ice Accessories": "categories.iceAccessories",
      Pourers: "categories.pourers",
      "Garnish & Prep": "categories.garnishPrep",
      Drinkware: "categories.drinkware",
      "Build Your Bar Kit": "nav.buildBarKit",
    };
    return keys[label] ? t(keys[label]) : label;
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-lg transition-all duration-500 ${
          isScrolled
            ? "bg-background/95 border-border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.65)]"
            : "bg-background/80 border-border/70"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src="/logo.png"
                  alt="Vyrnt logo"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border border-primary/50"
                />
                <span className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wide text-primary">
                  VYRNT
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => {
                const NavIcon = NAV_ICONS[item.label];
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className="nav-link flex items-center gap-1.5 py-2 text-sm font-medium uppercase tracking-wide"
                    >
                      {NavIcon && <NavIcon className="w-4 h-4" />}
                      {translateNavLabel(item.label)}
                      {item.submenu && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-300 ${
                            activeDropdown === item.label ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </Link>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {item.submenu && activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 pt-2"
                        >
                          <div className="bg-card/95 backdrop-blur-lg border border-border rounded-lg p-3 card-shadow w-[22rem] grid grid-cols-2 gap-0.5">
                            {item.submenu.map((subItem) => {
                              const SubIcon = SUBMENU_ICONS[subItem.label];
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className="flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                                >
                                  {SubIcon && <SubIcon className="w-4 h-4 shrink-0" />}
                                  <span className="truncate">{translateNavLabel(subItem.label)}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Delivery Location (R9) */}
              <div className="hidden xl:block">
                <Tooltip content={isLocationSet ? t("location.label") : t("location.selectLocation")}>
                  <div>
                    <LocationSelector />
                  </div>
                </Tooltip>
              </div>

              {/* Language (R8) */}
              <div className="hidden xl:block">
                <Tooltip content={t("common.language")}>
                  <div>
                    <LanguageSelector />
                  </div>
                </Tooltip>
              </div>

              {/* Search bar (opens global search palette) */}
              <Tooltip content={t("nav.search")}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.dispatchEvent(new Event("barware:open-search"))}
                  aria-label={t("nav.search")}
                  className="hidden md:flex items-center gap-2.5 w-56 xl:w-72 px-4 py-2.5 rounded-full border border-border bg-secondary/50 hover:border-primary transition-colors text-left text-sm text-muted-foreground"
                >
                  <Search className="w-4 h-4 shrink-0 text-primary" />
                  <span className="flex-1 truncate">{t("search.placeholder")}</span>
                  <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border shrink-0">
                    Ctrl K
                  </kbd>
                </motion.button>
              </Tooltip>
              <Tooltip content={t("nav.search")}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => window.dispatchEvent(new Event("barware:open-search"))}
                  aria-label={t("nav.search")}
                  className="md:hidden p-2 text-steel hover:text-primary transition-colors"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              </Tooltip>

              {/* Wishlist */}
              <Tooltip content={t("nav.wishlist")}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    href="/wishlist"
                    aria-label={t("nav.wishlist")}
                    className="relative p-2 text-steel hover:text-primary transition-colors inline-flex"
                  >
                    <Heart className="w-5 h-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </motion.div>
              </Tooltip>

              {/* Cart Button */}
              <Tooltip content={t("nav.cart")}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCartOpen(true)}
                  aria-label={t("nav.cart")}
                  className="relative p-2 text-steel hover:text-primary transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </motion.button>
              </Tooltip>

              {/* User Menu / Login Button */}
              {isLoggedIn ? (
                <div
                  className="relative"
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <Tooltip content={t("nav.account")}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={t("nav.account")}
                      className="p-2 text-steel hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full gradient-neon flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-semibold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </motion.button>
                  </Tooltip>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full right-0 pt-2"
                      >
                        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-lg p-3 min-w-48 card-shadow">
                          <p className="px-3 py-2 text-sm text-muted-foreground">
                            Hello, <span className="text-foreground font-medium">{user?.name}</span>
                          </p>
                          <Link
                            href="/account"
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <User className="w-4 h-4" />
                            {t("nav.account")}
                          </Link>
                          <Link
                            href="/orders"
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            {t("nav.myOrders")}
                          </Link>
                          <Link
                            href="/wishlist"
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <Heart className="w-4 h-4" />
                            {t("nav.wishlist")}
                          </Link>
                          <Link
                            href="/track-order"
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <Truck className="w-4 h-4" />
                            {t("nav.trackOrder")}
                          </Link>
                          <Link
                            href="/help"
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <LifeBuoy className="w-4 h-4" />
                            {t("footer.helpCentre")}
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              {t("nav.adminDashboard")}
                            </Link>
                          )}
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            {t("nav.logout")}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openLoginModal}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-full hover:opacity-90 transition-opacity"
                >
                  <User className="w-4 h-4" />
                  {t("nav.login")}
                </motion.button>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="lg:hidden p-2 text-primary"
                aria-label="Menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-background/95 backdrop-blur-lg border-t border-border max-h-[calc(100vh-5rem)] overflow-y-auto"
            >
              <div className="container mx-auto px-4 py-6">
                <div className="flex items-center gap-3 mb-6">
                  <LocationSelector />
                  <LanguageSelector />
                </div>

                {navItems.map((item, index) => {
                  const NavIcon = NAV_ICONS[item.label];
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 py-3 text-lg font-medium uppercase tracking-wide text-foreground/80 hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {NavIcon && <NavIcon className="w-5 h-5" />}
                        {translateNavLabel(item.label)}
                      </Link>
                      {item.submenu && (
                        <div className="grid grid-cols-2 gap-0.5 pb-3 pl-8">
                          {item.submenu.map((subItem) => {
                            const SubIcon = SUBMENU_ICONS[subItem.label];
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className="flex items-center gap-2 py-1.5 px-2 text-sm text-muted-foreground hover:text-primary rounded-md transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4 shrink-0" />}
                                <span className="truncate">{translateNavLabel(subItem.label)}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 py-3 text-lg font-medium uppercase tracking-wide text-foreground/80 hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Heart className="w-5 h-5" />
                  {t("nav.wishlist")}
                </Link>
                <Link
                  href="/track-order"
                  className="flex items-center gap-3 py-3 text-lg font-medium uppercase tracking-wide text-foreground/80 hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MapPin className="w-5 h-5" />
                  {t("nav.trackOrder")}
                </Link>
                <Link
                  href="/help"
                  className="flex items-center gap-3 py-3 text-lg font-medium uppercase tracking-wide text-foreground/80 hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LifeBuoy className="w-5 h-5" />
                  {t("footer.helpCentre")}
                </Link>

                {/* Mobile Login Button */}
                {!isLoggedIn && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navItems.length * 0.1 }}
                    onClick={() => {
                      openLoginModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-full"
                  >
                    <User className="w-4 h-4" />
                    {t("nav.login")}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;
