import { motion } from "framer-motion";
import Link from "@/components/AppLink";
import { MapPin, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/utils/siteConfig";

const footerLinks = {
  shop: [
    { label: "Cocktail Shakers", href: "/category/cocktail-shakers" },
    { label: "Cocktail Strainers", href: "/category/cocktail-strainers" },
    { label: "Muddlers", href: "/category/muddlers" },
    { label: "Measuring Tools", href: "/category/measuring-tools" },
    { label: "All Products", href: "/products" },
  ],
  collections: [
    { label: "Wine Accessories", href: "/category/wine-accessories" },
    { label: "Glassware", href: "/category/glassware" },
    { label: "Ice Accessories", href: "/category/ice-accessories" },
    { label: "Bartender Tool Sets", href: "/category/bartender-tool-sets" },
    { label: "Build Your Bar Kit", href: "/bar-kit" },
  ],
  account: [
    { label: "Our Story", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "My Orders", href: "/orders" },
    { label: "My Profile", href: "/profile" },
    { label: "Forgot Password", href: "/forgot-password" },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.div whileHover={{ scale: 1.02 }}>
              <Link href="/" className="inline-block text-4xl font-display tracking-wider mb-6">
                <span className="text-foreground">BAR</span>
                <span className="text-primary">WARE</span>
              </Link>
            </motion.div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Premium barware tools and accessories for every home bar and professional bartender.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                {siteConfig.contact.address}
              </p>
              <a
                href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 hover:text-foreground transition-colors"
              >
                <Phone className="w-4 h-4 text-primary" />
                {siteConfig.contact.phone}
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-3 hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4 text-primary" />
                {siteConfig.contact.email}
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-display text-xl text-foreground mb-6">SHOP</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="font-display text-xl text-foreground mb-6">COLLECTIONS</h4>
            <ul className="space-y-3">
              {footerLinks.collections.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display text-xl text-foreground mb-6">COMPANY</h4>
            <ul className="space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-10" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground text-center">
            © 2026 {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Cash on Delivery · Free shipping over ₹{siteConfig.freeShippingThreshold}
          </p>
        </div>
      </div>

      {/* Animated Background Accent */}
      <div className="h-1 gradient-neon" />
    </footer>
  );
};

export default Footer;
