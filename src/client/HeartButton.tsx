import React from 'react'
import clsx from 'clsx'
import css from './styles.js'

interface HeartButtonProps {
  favorited: boolean
  onToggle: () => void
  title?: string
  className?: string
  size?: number
}

export function HeartButton({
  favorited,
  onToggle,
  title,
  className,
  size = 15,
}: HeartButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onToggle()
  }

  return (
    <button
      type="button"
      className={clsx(css.heartBtn, favorited && css.heartFavorited, className)}
      onClick={handleClick}
      title={title ?? (favorited ? '取消收藏' : '收藏为此模型组合')}
      aria-label={title ?? (favorited ? '取消收藏' : '收藏为此模型组合')}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  )
}
