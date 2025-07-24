import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, Check } from 'lucide-react'

interface MagicButtonProps {
  onClick?: () => Promise<void> | void
  disabled?: boolean
  loading?: boolean
  completed?: boolean
  className?: string
}

export function MagicButton({ 
  onClick,
  disabled = false,
  loading = false,
  completed = false,
  className = ''
}: MagicButtonProps) {
  
  const handleClick = () => {
    if (disabled || loading) return
    onClick?.()
  }
  
  // 버튼 상태에 따른 내용 결정
  let Icon = Sparkles
  let text = '✨ AI 편집 시작'
  
  if (completed) {
    Icon = Check
    text = '✅ 편집 완료!'
  } else if (loading) {
    Icon = Loader2
    text = '🤖 AI 처리 중...'
  }
  
  return (
    <motion.button
      className={`magic-button ${disabled ? 'magic-button--disabled' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98, y: 0 } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 버튼 내용 */}
      <div className="flex items-center justify-center gap-3">
        <motion.div
          animate={loading ? { rotate: 360 } : { rotate: 0 }}
          transition={loading ? { 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear" 
          } : { duration: 0.3 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
        
        <span className="font-semibold">
          {text}
        </span>
      </div>
      
      {/* 호버 글로우 효과 */}
      {!disabled && !loading && (
        <motion.div
          className="magic-glow"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  )
}