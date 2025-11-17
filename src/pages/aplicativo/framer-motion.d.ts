import 'framer-motion'

declare module 'framer-motion' {
  import { HTMLAttributes, ReactNode } from 'react'
  
  export interface MotionProps extends HTMLAttributes<HTMLElement> {
    children?: ReactNode
    className?: string
    onClick?: () => void
    disabled?: boolean
  }
}

