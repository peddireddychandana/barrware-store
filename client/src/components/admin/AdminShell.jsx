import Link from "@/components/AppLink";
import { usePathname } from "@/lib/router";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/context/AuthContext";

const ADMIN_LINKS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Coupons", href: "/admin/coupons" },
  { label: "Inquiries", href: "/admin/inquiries" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Reports", href: "/admin/reports" },
];

const isActiveLink = (pathname, href) =>
  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

const AdminNav = () => {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 mb-8" aria-label="Admin sections">
      {ADMIN_LINKS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={`shrink-0 px-6 py-2 rounded-full font-medium uppercase tracking-wide text-sm transition-all duration-300 ${
            isActiveLink(pathname, href)
              ? "gradient-neon text-primary-foreground neon-glow"
              : "bg-secondary text-muted-foreground hover:text-primary"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

const AccessGate = ({ children }) => {
  const { isLoading, isLoggedIn, isAdmin, openLoginModal } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-32" role="status" aria-label="Checking access">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center bg-card border border-border rounded-2xl p-10 card-shadow"
      >
        <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-display mb-3">
          ADMIN <span className="text-gradient">ACCESS ONLY</span>
        </h1>
        <p className="text-muted-foreground mb-6">
          {isLoggedIn
            ? "Your account does not have permission to view this area."
            : "Please sign in with an admin account to manage the store."}
        </p>
        <div className="flex justify-center gap-3">
          {!isLoggedIn && (
            <button
              onClick={openLoginModal}
              className="px-8 py-3 rounded-full gradient-neon text-primary-foreground font-medium uppercase tracking-wide text-sm neon-glow"
            >
              Sign in
            </button>
          )}
          <Link
            href="/"
            className="px-8 py-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground font-medium uppercase tracking-wide text-sm"
          >
            Back to store
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
};

const AdminShell = ({ children }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <LoginModal />
    <main className="pt-28 pb-20">
      <div className="container mx-auto px-4 lg:px-8">
        <AccessGate>{children}</AccessGate>
      </div>
    </main>
    <Footer />
  </div>
);

export default AdminShell;
