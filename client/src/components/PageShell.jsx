import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";

/** Shared chrome for customer pages: navbar, login modal, padded container, footer. */
const PageShell = ({ children }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <LoginModal />
    <main className="pt-24 pb-20">
      <div className="container mx-auto px-4 lg:px-8">{children}</div>
    </main>
    <Footer />
  </div>
);

export default PageShell;
