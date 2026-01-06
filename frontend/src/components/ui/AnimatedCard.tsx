'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

export default function AnimatedCard({ 
  children, 
  className = '',
  delay = 0,
  hover = true
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : undefined}
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 ${className}`}
    >
      {children}
    </motion.div>
  )
}
