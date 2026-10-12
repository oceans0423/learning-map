import type { ButtonHTMLAttributes } from 'react'
import '../styles/buttons.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'toggle'
  stable?: boolean
}

/** Native button semantics: Enter/Space, disabled and aria-pressed stay native. */
export function Button({
  variant = 'secondary',
  stable = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`ui-button ui-button--${variant}${stable ? ' ui-button--stable' : ''} ${className}`}
    />
  )
}
