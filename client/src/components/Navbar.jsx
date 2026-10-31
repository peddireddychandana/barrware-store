import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "@/components/AppLink";
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Search,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import CartDrawer from "./CartDrawer";

const navItems = [
  { label: "Home", href: "/" },
  {
    label: "Shop",
    href: "/products",
    submenu: [
      { label: "Cocktail Shakers", href: "/category/cocktail-shakers" },
      { label: "Cocktail Strainers", href: "/category/cocktail-strainers" },
      { label: "Muddlers", href: "/category/muddlers" },
      { label: "Measuring Tools", href: "/category/measuring-tools" },
      { label: "Wine Accessories", href: "/category/wine-accessories" },
      { label: "Glassware", href: "/category/glassware" },
      { label: "Bar Spoons", href: "/category/bar-spoons" },
      { label: "Ice Accessories", href: "/category/ice-accessories" },
      { label: "Bottle Pourers", href: "/category/bottle-pourers" },
      { label: "Cocktail Mixing Glasses", href: "/category/cocktail-mixing-glasses" },
      { label: "Bartender Tool Sets", href: "/category/bartender-tool-sets" },
      { label: "Build Your Bar Kit", href: "/bar-kit" },
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

  const { cartCount } = useCart();
  const { user, isLoggedIn, isAdmin, logout, openLoginModal } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "bg-background/95 backdrop-blur-lg border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="text-3xl md:text-4xl font-display tracking-wider"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-foreground">BAR</span>
                <span className="text-primary">WARE</span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className="nav-link flex items-center gap-1 py-2 text-sm font-medium uppercase tracking-wide"
                  >
                    {item.label}
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
                        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-lg p-4 min-w-48 card-shadow">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className="block py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Search Button (opens global command palette) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new Event("barware:open-search"))}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-secondary/50 hover:border-primary transition-colors text-muted-foreground hover:text-foreground"
              >
                <Search className="w-4 h-4" />
                <span className="text-xs">Search</span>
                <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border">
                  ⌘K
                </kbd>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.dispatchEvent(new Event("barware:open-search"))}
                className="md:hidden p-2 text-foreground/80 hover:text-foreground transition-colors"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Cart Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-foreground/80 hover:text-foreground transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
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

              {/* User Menu / Login Button */}
              {isLoggedIn ? (
                <div
                  className="relative"
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full gradient-neon flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-semibold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </motion.button>

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
                            href="/profile"
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <User className="w-4 h-4" />
                            My Profile
                          </Link>
                          <Link
                            href="/orders"
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            My Orders
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Admin Dashboard
                            </Link>
                          )}
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
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
                  Login
                </motion.button>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="lg:hidden p-2 text-foreground"
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
              className="lg:hidden bg-background/95 backdrop-blur-lg border-t border-border"
            >
              <div className="container mx-auto px-4 py-6">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className="block py-3 text-lg font-medium uppercase tracking-wide text-foreground/80 hover:text-primary transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

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
                    Login
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
