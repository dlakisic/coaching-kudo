'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient'
  padding?: 'sm' | 'md' | 'lg' | 'none'
  onClick?: () => void
  hover?: boolean
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  hover = false
}: CardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const baseClasses = 'rounded-xl transition-all duration-200'
  
  const getVariantClasses = () => {
    const variants = {
      default: isDark 
        ? 'bg-gray-800 border border-gray-700 shadow-sm' 
        : 'bg-white border border-gray-200 shadow-sm',
      elevated: isDark 
        ? 'bg-gray-800 shadow-lg border border-gray-700' 
        : 'bg-white shadow-lg border border-gray-100',
      outlined: isDark 
        ? 'bg-gray-800 border-2 border-gray-600' 
        : 'bg-white border-2 border-gray-200',
      gradient: isDark 
        ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-800' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100'
    }
    return variants[variant]
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const hoverClasses = hover ? 'hover:shadow-lg hover:scale-105 cursor-pointer' : ''
  const clickableClasses = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`
        ${baseClasses}
        ${getVariantClasses()}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${clickableClasses}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return (
    <div className={`border-b pb-4 mb-4 ${isDark ? 'border-gray-700' : 'border-gray-100'} ${className}`}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return (
    <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'} ${className}`}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return (
    <div className={`border-t pt-4 mt-4 ${isDark ? 'border-gray-700' : 'border-gray-100'} ${className}`}>
      {children}
    </div>
  )
}