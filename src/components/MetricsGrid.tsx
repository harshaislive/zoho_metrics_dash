import React from 'react';
import { motion } from 'framer-motion';

interface MetricsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export default function MetricsGrid({ children, columns = 2 }: MetricsGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  // Create a staggered animation for children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  // Wrap each child in a motion.div for animation
  const animatedChildren = React.Children.map(children, child => (
    <motion.div variants={item}>
      {child}
    </motion.div>
  ));

  return (
    <motion.div 
      className={`grid ${gridCols[columns]} gap-6`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {animatedChildren}
    </motion.div>
  );
} 