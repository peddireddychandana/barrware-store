import { lazy, Suspense, useEffect } from "react";
import { Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";

import Index from "@/views/Index";
import AdminShell from "@/components/admin/AdminShell";
import { trackPageView } from "@/lib/analytics";

const AllProductsPage = lazy(() => import("@/views/AllProductsPage"));
const CategoryPage = lazy(() => import("@/views/CategoryPage"));
const ProductDetailPage = lazy(() => import("@/views/ProductDetailPage"));
const BarKitPage = lazy(() => import("@/views/BarKitPage"));
const CheckoutPage = lazy(() => import("@/views/CheckoutPage"));
const OrdersPage = lazy(() => import("@/views/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/views/OrderDetailPage"));
const InvoicePage = lazy(() => import("@/views/InvoicePage"));
const TrackOrderPage = lazy(() => import("@/views/TrackOrderPage"));
const WishlistPage = lazy(() => import("@/views/WishlistPage"));
const ProfilePage = lazy(() => import("@/views/ProfilePage"));
const ForgotPasswordPage = lazy(() => import("@/views/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/views/ResetPasswordPage"));
const AboutPage = lazy(() => import("@/views/AboutPage"));
const ContactPage = lazy(() => import("@/views/ContactPage"));
const LegalPage = lazy(() => import("@/views/LegalPage"));
const NotFound = lazy(() => import("@/views/NotFound"));
const AdminDashboardPage = lazy(() => import("@/views/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("@/views/admin/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("@/views/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("@/views/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("@/views/admin/AdminOrderDetailPage"));
const AdminCustomersPage = lazy(() => import("@/views/admin/AdminCustomersPage"));
const AdminCouponsPage = lazy(() => import("@/views/admin/AdminCouponsPage"));
const AdminReturnsPage = lazy(() => import("@/views/admin/AdminReturnsPage"));
const AdminInquiriesPage = lazy(() => import("@/views/admin/AdminInquiriesPage"));
const AdminReportsPage = lazy(() => import("@/views/admin/AdminReportsPage"));
const AdminReviewsPage = lazy(() => import("@/views/admin/AdminReviewsPage"));

/** Scrolls to the top on navigation, or to the #hash target when the link has one. */
const ScrollManager = () => {
  const { pathname, hash, search } = useLocation();

  useEffect(() => {
    trackPageView(`${pathname}${search}`);
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, search]);

  return null;
};

const CategoryRoute = () => <CategoryPage category={useParams().category} />;
const AdminOrderDetailRoute = () => <AdminOrderDetailPage orderId={useParams().id} />;

const AdminLayout = () => (
  <AdminShell>
    <Suspense fallback={<p className="py-20 text-center text-muted-foreground">Loading...</p>}>
      <Outlet />
    </Suspense>
  </AdminShell>
);

const App = () => (
  <>
    <ScrollManager />
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<AllProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/category/:category" element={<CategoryRoute />} />
        <Route path="/bar-kit" element={<BarKitPage />} />
        <Route path="/custom-bar-kit-builder" element={<BarKitPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/orders/:id/invoice" element={<InvoicePage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<LegalPage page="privacy" />} />
        <Route path="/terms" element={<LegalPage page="terms" />} />
        <Route path="/shipping-policy" element={<LegalPage page="shipping" />} />
        <Route path="/refund-policy" element={<LegalPage page="refunds" />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailRoute />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="returns" element={<AdminReturnsPage />} />
          <Route path="inquiries" element={<AdminInquiriesPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
);

export default App;
