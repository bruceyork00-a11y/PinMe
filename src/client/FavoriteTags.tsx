import React from 'react'
import { clsx } from './clsx.js'
import { useFavorites, removeFavorite } from './storage.js'
import type { ModelFavorite } from './types.js'
import css from './styles.js'

interface FavoriteTagsProps {
  currentProvider?: string
  currentModel?: string
  currentEffort?: string
  disabled?: boolean
  onSelect: (selection: { provider: string; model: string; reasoningEffort?: string }) => void
  onOpenMenu?: () => void
}

export function FavoriteTags({
  currentProvider,
  currentModel,
  currentEffort,
  disabled,
  onSelect,
  onOpenMenu,
}: FavoriteTagsProps) {
  const favorites = useFavorites()

  if (favorites.length === 0) {
    return (
      <div className={css.tagContainer} role="toolbar" aria-label="收藏模型快捷标签">
        <div
          className={css.tagPill}
          style={{
            borderStyle: 'dashed',
            cursor: 'pointer',
            opacity: 0.85,
            borderColor: 'var(--vp-c-brand-soft, #38bdf8)',
          }}
          onClick={onOpenMenu}
          title="点击打开菜单，点击心形图标 ♡ 即可收藏当前模型+思考强度"
        >
          <span style={{ color: '#ef4444', fontSize: '13px' }}>♡</span>
          <span className={css.tagText} style={{ color: 'var(--vp-c-brand-1, #0284c7)' }}>
            点击菜单 ♡ 收藏预设
          </span>
        </div>
      </div>
    )
  }

  const handleTagClick = (fav: ModelFavorite, e: React.MouseEvent) => {
    e.preventDefault()
    if (disabled) return
    onSelect({
      provider: fav.provider,
      model: fav.model,
      reasoningEffort: fav.reasoningEffort,
    })
  }

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    removeFavorite(id)
  }

  return (
    <div className={css.tagContainer} role="toolbar" aria-label="收藏模型快捷标签">
      {favorites.map((fav) => {
        const isActive =
          currentProvider === fav.provider &&
          currentModel === fav.model &&
          (currentEffort ?? undefined) === (fav.reasoningEffort ?? undefined)

        return (
          <div
            key={fav.id}
            className={clsx(css.tagPill, isActive && css.tagPillActive)}
            onClick={(e) => handleTagClick(fav, e)}
            role="button"
            tabIndex={0}
            title={`一键切换到: ${fav.modelName}${fav.effortLabel ? ` (${fav.effortLabel})` : ''}`}
          >
            <span className={css.tagDot} />
            <span className={css.tagText}>{fav.shortLabel}</span>
            <button
              type="button"
              className={css.tagCloseBtn}
              onClick={(e) => handleRemove(fav.id, e)}
              title="移除此快捷标签"
              aria-label="移除此快捷标签"
            >
              ×
            </button>
          </div>
        )
      })}

      {/* Quick Add '+' button */}
      <div
        className={css.tagPill}
        style={{
          padding: '0 6px',
          opacity: 0.7,
          cursor: 'pointer',
          borderStyle: 'dashed',
        }}
        onClick={onOpenMenu}
        title="打开菜单添加更多快捷模型"
      >
        <span style={{ fontWeight: 600 }}>+</span>
      </div>
    </div>
  )
}
