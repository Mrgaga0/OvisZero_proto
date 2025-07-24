import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Loader2, FileVideo } from 'lucide-react'

interface StatusIndicatorProps {
  status: 'ready' | 'warning' | 'processing' | 'complete'
  message: string
  submessage?: string
}

export function StatusIndicator({ status, message, submessage }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          icon: CheckCircle2,
          className: 'text-accent-green',
          bgClassName: 'bg-accent-green/10'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          className: 'text-status-warning',
          bgClassName: 'bg-status-warning/10'
        }
      case 'processing':
        return {
          icon: Loader2,
          className: 'text-chart-2',
          bgClassName: 'bg-chart-2/10',
          animate: { rotate: 360 },
          transition: { duration: 2, repeat: Infinity, ease: "linear" }
        }
      case 'complete':
        return {
          icon: FileVideo,
          className: 'text-accent-green',
          bgClassName: 'bg-accent-green/10'
        }
      default:
        return {
          icon: AlertTriangle,
          className: 'text-muted-foreground',
          bgClassName: 'bg-muted/10'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <motion.div 
      className={`flex items-center justify-center gap-2 p-3 rounded-lg ${config.bgClassName} ${config.className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={config.animate}
        transition={config.transition}
      >
        <Icon className="w-5 h-5" />
      </motion.div>
      
      <div className="text-center">
        <p className="font-medium text-sm">{message}</p>
        {submessage && (
          <p className="text-xs opacity-70 mt-1">{submessage}</p>
        )}
      </div>
    </motion.div>
  )
}