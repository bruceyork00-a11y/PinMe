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
}

/**
 * The favorites bar: one pill per pinned model+effort combination.
 * Renders nothing while there are no favorites (bookmarks-bar semantics) —
 * the model menu itself remains the single place to create them.
 */
export function FavoriteTags({
  currentProvider,
  currentModel,
  currentEffort,
  disabled,
  onSelect,
}: FavoriteTagsProps) {
  const favorites = useFavorites()

  if (favorites.length === 0) return null

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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleTagClick(fav, e as unknown as React.MouseEvent)
              }
            }}
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
    </div>
  )
}
