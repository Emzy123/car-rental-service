import { motion } from 'framer-motion';

export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
      className="page-enter"
    >
      {children}
    </motion.div>
  );
}
