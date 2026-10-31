import { motion } from "framer-motion";

/** Display heading: plain words plus one gradient word, e.g. MY <ORDERS>. */
const PageHeading = ({ title, highlight, subtitle, className = "text-center mb-10" }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={className}>
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-4">
      {title} <span className="text-gradient">{highlight}</span>
    </h1>
    {subtitle && <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>}
  </motion.div>
);

export default PageHeading;
