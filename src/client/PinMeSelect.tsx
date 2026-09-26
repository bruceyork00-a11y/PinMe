/**
 * PinMeSelect: Enhanced Model Selection Component for DeepSeek Harness.
 * - Adds FavoriteTags right next to the model trigger button (Image 1)
 * - Adds HeartButton to reasoning efforts & models for 1-click pinning (Image 2)
 */

import React, {
  useEffect, useId, useMemo, useRef, useState, useSyncExternalStore,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { clsx } from './clsx.js'
import { FavoriteTags } from './FavoriteTags.js'
import { HeartButton } from './HeartButton.js'
import { buildFavoriteId, toggleFavorite, useFavorites } from './storage.js'
import styles from './styles.js'

export interface ModelReasoningEffort {
  id: string
  name: string
  description?: string
}

export interface ModelMetadata {
  id: string
  name: string
  description?: string
  reasoning?: {
    defaultEffort?: string
    efforts: ModelReasoningEffort[]
  }
}

export interface ModelGroup {
  id: string
  name: string
  models: ModelMetadata[]
}

export interface ModelSelection {
  provider: string
  model: string
  reasoningEffort?: string
}

export interface ModelDirectoryState {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'selecting'
  groups: ModelGroup[]
  failures: Array<{ id: string; name: string; message: string }>
  current: ModelSelection | null
  routable: boolean | null
  error: string | null
}

export interface ModelSelectInjected {
  available: boolean
  directory: {
    getSnapshot: () => ModelDirectoryState
    subscribe: (listener: () => void) => () => void
  }
  load: () => void
  select: (selection: ModelSelection) => Promise<any>
}

type Pane = 'root' | 'model' | 'effort'

interface EffortChoice {
  key: string
  effort: string | undefined
  label: string
}

const MEASURE_STYLE: CSSProperties = { visibility: 'hidden', left: 0, top: 0 }

function shortenName(name: string): string {
  return name.replace(/^deepseek-ai\//i, '').replace(/^google\//i, '')
}

export function PinMeSelect({
  locked,
  available,
  directory,
  load,
  select,
  t = ((k: string) => k) as any,
}: ModelSelectInjected & { locked: boolean; t?: any }) {
  const state = useSyncExternalStore(
    fn => directory.subscribe(fn),
    () => directory.getSnapshot(),
  )

  const [open, setOpen] = useState(false)
  const [pane, setPane] = useState<Pane>('root')
  const lastActionRef = useRef<'load' | 'select'>('load')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuPos, setMenuPos] = useState<CSSProperties | null>(null)
  const id = useId()

  // Reactive favorites so heart buttons flip immediately on click.
  const favorites = useFavorites()
  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites])
  const isFavorited = (provider: string, model: string, effort?: string) =>
    favoriteIds.has(buildFavoriteId(provider, model, effort))

  const groups = useMemo(() => {
    return [...(state.groups || [])].sort((left, right) =>
      (left.id === 'deepseek-account' ? 0 : left.id === 'deepseek-official' ? 1 : 2) -
      (right.id === 'deepseek-account' ? 0 : right.id === 'deepseek-official' ? 1 : 2)
    )
  }, [state.groups])

  const choices = useMemo(() => {
    return groups.flatMap(group =>
      group.models.map(model => ({
        group,
        model,
        selection: {
          provider: group.id,
          model: model.id,
          ...(model.reasoning?.defaultEffort === undefined
            ? {}
            : { reasoningEffort: model.reasoning.defaultEffort }),
        } satisfies ModelSelection,
      }))
    )
  }, [groups])

  const selectedIndex = state.current === null
    ? -1
    : choices.findIndex(c => c.selection.provider === state.current?.provider && c.selection.model === state.current.model)
  const currentChoice = choices[selectedIndex]
  const reasoning = currentChoice?.model.reasoning
  const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort

  const effortLabel = reasoning === undefined
    ? undefined
    : effectiveEffort === undefined
      ? (typeof t === 'function' ? t('effort.providerDefault') : 'Default')
      : reasoning.efforts.find(level => level.id === effectiveEffort)?.name ?? effectiveEffort

  const effortChoices = useMemo<readonly EffortChoice[]>(() => {
    if (reasoning === undefined) return []
    return [
      ...(reasoning.defaultEffort === undefined
        ? [{ key: 'provider-default', effort: undefined, label: typeof t === 'function' ? t('effort.providerDefault') : 'Default' }]
        : []),
      ...reasoning.efforts.map(effort => ({
        key: `effort:${effort.id}`,
        effort: effort.id,
        label: effort.name,
      })),
    ]
  }, [reasoning, t])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent): void => {
      if (rootRef.current?.contains(event.target as Node) === true) return
      if (menuRef.current?.contains(event.target as Node) === true) return
      setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => { document.removeEventListener('mousedown', closeOutside) }
  }, [open])

  const openMenu = () => {
    if (locked) return
    setPane('root')
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      // Align dropdown to the right edge of the button so it stays fully inside the screen
      const left = Math.max(10, rect.right - 260)
      setMenuPos({
        position: 'fixed',
        left: `${left}px`,
        bottom: `${window.innerHeight - rect.top + 6}px`,
        zIndex: 99999,
      })
    }
    setOpen(true)
    load()
  }

  const close = () => {
    setOpen(false)
  }

  const submit = (selection: ModelSelection): void => {
    lastActionRef.current = 'select'
    void select(selection)
  }

  const choose = (selection: ModelSelection): void => {
    submit(selection)
    close()
  }

  const chooseEffort = (effort: string | undefined): void => {
    if (state.current === null) return
    const selection: ModelSelection = {
      provider: state.current.provider,
      model: state.current.model,
      ...(effort === undefined ? {} : { reasoningEffort: effort }),
    }
    submit(selection)
    close()
  }

  const modelLabel = currentChoice?.model.name ??
    (state.current === null ? 'Select Model' : `${state.current.provider}/${state.current.model}`)

  if (!available) return null

  return (
    <div className={styles.wrapper}>
      {/* 1. Quick Switch Tags Bar (hidden until favorites exist) */}
      <FavoriteTags
        currentProvider={state.current?.provider}
        currentModel={state.current?.model}
        currentEffort={effectiveEffort}
        disabled={locked}
        onSelect={(selection) => {
          submit(selection)
        }}
      />

      {/* 2. Primary Model Trigger */}
      <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={locked}
          onClick={() => { open ? close() : openMenu() }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            height: '28px',
            padding: '0 8px',
            borderRadius: '6px',
            border: '1px solid transparent',
            background: open ? 'var(--vp-c-bg-mute, rgba(0,0,0,0.06))' : 'transparent',
            color: 'var(--vp-c-text-1, #1e293b)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: locked ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!open) e.currentTarget.style.background = 'var(--vp-c-bg-mute, rgba(0,0,0,0.05))'
          }}
          onMouseLeave={(e) => {
            if (!open) e.currentTarget.style.background = 'transparent'
          }}
        >
          <span>{modelLabel}</span>
          {effortLabel !== undefined && (
            <span style={{ opacity: 0.65, fontSize: '12px', fontWeight: 400 }}>{effortLabel}</span>
          )}
          {/* Chevron Icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              opacity: 0.7,
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* 3. Menu Surface Portal */}
        {open && typeof document !== 'undefined' && createPortal(
          <div
            ref={menuRef}
            style={{
              ...(menuPos ?? MEASURE_STYLE),
              width: '260px',
              maxHeight: '380px',
              overflowY: 'auto',
              background: 'var(--vp-c-bg, #ffffff)',
              color: 'var(--vp-c-text-1, #1e293b)',
              border: '1px solid var(--vp-c-divider, rgba(140,140,140,0.25))',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              padding: '6px',
              fontSize: '13px',
            }}
          >
            {/* PANE: ROOT */}
            {pane === 'root' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--vp-c-text-3, #94a3b8)', padding: '4px 8px' }}>
                  Model Configuration
                </div>
                <button
                  type="button"
                  onClick={() => setPane('model')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vp-c-bg-mute, rgba(0,0,0,0.05))' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontWeight: 500 }}>Model</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.75 }}>
                    <span>{modelLabel}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>

                {reasoning !== undefined && (
                  <button
                    type="button"
                    onClick={() => setPane('effort')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vp-c-bg-mute, rgba(0,0,0,0.05))' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontWeight: 500 }}>Thinking Intensity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.75 }}>
                      <span>{effortLabel}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* PANE: MODEL LIST */}
            {pane === 'model' && (
              <div>
                <button
                  type="button"
                  onClick={() => setPane('root')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    color: 'var(--vp-c-brand-1, #0284c7)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>

                {groups.map(group => (
                  <div key={group.id} style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--vp-c-text-3, #94a3b8)', padding: '4px 8px' }}>
                      {group.name}
                    </div>
                    {group.models.map(model => {
                      const isSelected = state.current?.provider === group.id && state.current.model === model.id
                      const isFav = isFavorited(group.id, model.id, model.reasoning?.defaultEffort)

                      return (
                        <div
                          key={model.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: isSelected ? 'var(--vp-c-brand-soft, rgba(2,132,199,0.1))' : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() => choose({ provider: group.id, model: model.id })}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'var(--vp-c-bg-mute, rgba(0,0,0,0.04))'
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                            {isSelected && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--vp-c-brand-1, #0284c7)', flexShrink: 0 }}>
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                            <span style={{ fontWeight: isSelected ? 600 : 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {model.name}
                            </span>
                          </div>

                          {/* Heart Bookmark Button */}
                          <HeartButton
                            favorited={isFav}
                            onToggle={() => {
                              toggleFavorite({
                                provider: group.id,
                                model: model.id,
                                modelName: model.name,
                                reasoningEffort: model.reasoning?.defaultEffort,
                                effortLabel: model.reasoning?.defaultEffort,
                                shortLabel: shortenName(model.name),
                              })
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* PANE: THINKING INTENSITY / EFFORT */}
            {pane === 'effort' && (
              <div>
                <button
                  type="button"
                  onClick={() => setPane('root')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    color: 'var(--vp-c-brand-1, #0284c7)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>

                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--vp-c-text-3, #94a3b8)', padding: '4px 8px' }}>
                  Thinking Intensity
                </div>

                {effortChoices.map(level => {
                  const isSelected = effectiveEffort === level.effort
                  const isFav = state.current ? isFavorited(state.current.provider, state.current.model, level.effort) : false

                  return (
                    <div
                      key={level.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        background: isSelected ? 'var(--vp-c-brand-soft, rgba(2,132,199,0.1))' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => chooseEffort(level.effort)}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--vp-c-bg-mute, rgba(0,0,0,0.04))'
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--vp-c-brand-1, #0284c7)' }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        <span style={{ fontWeight: isSelected ? 600 : 400 }}>{level.label}</span>
                      </div>

                      {/* Heart Bookmark Button (Matching Image 2) */}
                      {state.current && (
                        <HeartButton
                          favorited={isFav}
                          title={isFav ? `取消收藏 ${modelLabel} (${level.label})` : `收藏 ${modelLabel} (${level.label}) 为快捷标签`}
                          onToggle={() => {
                            if (!state.current) return
                            toggleFavorite({
                              provider: state.current.provider,
                              model: state.current.model,
                              modelName: currentChoice?.model.name ?? state.current.model,
                              reasoningEffort: level.effort,
                              effortLabel: level.label,
                              shortLabel: `${shortenName(currentChoice?.model.name ?? state.current.model)} · ${level.label}`,
                            })
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
