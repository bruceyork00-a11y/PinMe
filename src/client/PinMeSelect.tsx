/**
 * PinMeSelect: the composer's model seat with favorite presets.
 * - Renders the favorites bar next to the model trigger.
 * - Keeps the native Model / Thinking Intensity drill-down and adds a heart to
 *   each intensity level so a favorite always carries model + intensity.
 *
 * It replaces the single `conversation.input.model` seat, so it mirrors the
 * native seat's interface (available/directory/load/select + t) and restores
 * the keyboard affordances the native menu had (Escape to close, focus return,
 * a visible error surface and a pending hint).
 */

import React, {
  useEffect, useMemo, useRef, useState, useSyncExternalStore,
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

type Translate = (key: string, params?: Record<string, string>) => string

interface EffortChoice {
  key: string
  effort: string | undefined
  label: string
}

const MEASURE_STYLE: CSSProperties = { visibility: 'hidden', left: 0, top: 0 }

const identity: Translate = (key) => key

function shortenName(name: string): string {
  return name.replace(/^deepseek-ai\//i, '').replace(/^google\//i, '')
}

export function PinMeSelect({
  locked,
  available,
  directory,
  load,
  select,
  t = identity,
}: ModelSelectInjected & { locked: boolean; t?: Translate }) {
  const state = useSyncExternalStore(
    fn => directory.subscribe(fn),
    () => directory.getSnapshot(),
  )

  const [open, setOpen] = useState(false)
  const [pane, setPane] = useState<Pane>('root')
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [menuPos, setMenuPos] = useState<CSSProperties | null>(null)

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

  const providerDefaultLabel = t('providerDefault')

  const effortLabel = reasoning === undefined
    ? undefined
    : effectiveEffort === undefined
      ? providerDefaultLabel
      : reasoning.efforts.find(level => level.id === effectiveEffort)?.name ?? effectiveEffort

  const effortChoices = useMemo<readonly EffortChoice[]>(() => {
    if (reasoning === undefined) {
      // No reasoning levels: expose the provider default as the single choice so
      // this model is still pinnable (a favorite always carries an intensity).
      return [{ key: 'provider-default', effort: undefined, label: providerDefaultLabel }]
    }
    return [
      ...(reasoning.defaultEffort === undefined
        ? [{ key: 'provider-default', effort: undefined, label: providerDefaultLabel }]
        : []),
      ...reasoning.efforts.map(effort => ({
        key: `effort:${effort.id}`,
        effort: effort.id,
        label: effort.name,
      })),
    ]
  }, [reasoning, providerDefaultLabel])

  const busy = state.status === 'selecting'

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent): void => {
      if (rootRef.current?.contains(event.target as Node) === true) return
      if (menuRef.current?.contains(event.target as Node) === true) return
      close(true)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(true)
      }
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const openMenu = () => {
    if (locked) return
    setError(null)
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

  const close = (restoreFocus = false) => {
    setOpen(false)
    setPane('root')
    if (restoreFocus) queueMicrotask(() => { triggerRef.current?.focus() })
  }

  // One select path for the menu and the pills: a rejection is surfaced instead
  // of closing silently (the native seat shows the same store error).
  const submit = (selection: ModelSelection, after?: () => void): void => {
    if (busy) return
    setError(null)
    let result: any
    try {
      result = select(selection)
    } catch (err) {
      setError(t('error', { message: err instanceof Error ? err.message : String(err) }))
      return
    }
    Promise.resolve(result).then(
      (ok) => {
        if (ok === false) {
          setError(t('error', { message: directory.getSnapshot().error ?? '' }))
          return
        }
        after?.()
      },
      (err) => setError(t('error', { message: err instanceof Error ? err.message : String(err) })),
    )
  }

  const choose = (selection: ModelSelection): void => {
    submit(selection, () => close(true))
  }

  const chooseEffort = (effort: string | undefined): void => {
    if (state.current === null) return
    const selection: ModelSelection = {
      provider: state.current.provider,
      model: state.current.model,
      ...(effort === undefined ? {} : { reasoningEffort: effort }),
    }
    submit(selection, () => close(true))
  }

  const modelRowKeyDown = (selection: ModelSelection) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(selection)
    }
  }

  const effortRowKeyDown = (effort: string | undefined) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      chooseEffort(effort)
    }
  }

  const modelLabel = currentChoice?.model.name ??
    (state.current === null ? t('selectModel') : `${state.current.provider}/${state.current.model}`)

  // Header shortcut pin for the exact combination that is currently active.
  const currentModelName = currentChoice?.model.name ?? state.current?.model ?? ''
  const currentEffortLabel = effortLabel ?? providerDefaultLabel
  const currentFavorited = state.current !== null &&
    isFavorited(state.current.provider, state.current.model, effectiveEffort)

  if (!available) return null

  return (
    <div className={styles.wrapper}>
      {/* 1. Quick Switch Tags Bar (hidden until favorites exist) */}
      <FavoriteTags
        currentProvider={state.current?.provider}
        currentModel={state.current?.model}
        currentEffort={effectiveEffort}
        disabled={locked}
        t={t}
        onSelect={(selection) => {
          submit(selection)
        }}
      />

      {/* Selection failure while the menu is closed (e.g. a pill click) */}
      {error !== null && !open && (
        <span className={styles.tagError} role="alert">{error}</span>
      )}

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
            role="menu"
            aria-label={t('header')}
            aria-busy={busy}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px 2px 8px', minHeight: '24px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--vp-c-text-3, #94a3b8)' }}>
                    {t('header')}
                  </span>
                  {state.current !== null && (
                    <HeartButton
                      size={14}
                      favorited={currentFavorited}
                      title={currentFavorited
                        ? t('unpinCurrent', { model: currentModelName, effort: currentEffortLabel })
                        : t('pinCurrent', { model: currentModelName, effort: currentEffortLabel })}
                      onToggle={() => {
                        if (state.current === null) return
                        toggleFavorite({
                          provider: state.current.provider,
                          model: state.current.model,
                          modelName: currentModelName,
                          reasoningEffort: effectiveEffort,
                          effortLabel: currentEffortLabel,
                          shortLabel: `${shortenName(currentModelName)} · ${currentEffortLabel}`,
                        })
                      }}
                    />
                  )}
                </div>
                <button
                  type="button"
                  role="menuitem"
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
                  <span style={{ fontWeight: 500 }}>{t('model')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.75 }}>
                    <span>{modelLabel}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>

                {state.current !== null && (
                  <button
                    type="button"
                    role="menuitem"
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
                    <span style={{ fontWeight: 500 }}>{t('effort')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.75 }}>
                      <span>{effortLabel ?? providerDefaultLabel}</span>
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
                  {t('back')}
                </button>

                {groups.map(group => (
                  <div key={group.id} style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--vp-c-text-3, #94a3b8)', padding: '4px 8px' }}>
                      {group.name}
                    </div>
                    {group.models.map(model => {
                      const isSelected = state.current?.provider === group.id && state.current.model === model.id

                      return (
                        <div
                          key={model.id}
                          role="menuitem"
                          tabIndex={0}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: isSelected ? 'var(--vp-c-brand-soft, rgba(2,132,199,0.1))' : 'transparent',
                            cursor: busy ? 'default' : 'pointer',
                          }}
                          onClick={() => choose({ provider: group.id, model: model.id })}
                          onKeyDown={modelRowKeyDown({ provider: group.id, model: model.id })}
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
                  {t('back')}
                </button>

                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--vp-c-text-3, #94a3b8)', padding: '4px 8px' }}>
                  {t('effort')}
                </div>

                {effortChoices.map(level => {
                  const isSelected = effectiveEffort === level.effort
                  const isFav = state.current ? isFavorited(state.current.provider, state.current.model, level.effort) : false

                  return (
                    <div
                      key={level.key}
                      role="menuitem"
                      tabIndex={0}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        background: isSelected ? 'var(--vp-c-brand-soft, rgba(2,132,199,0.1))' : 'transparent',
                        cursor: busy ? 'default' : 'pointer',
                      }}
                      onClick={() => chooseEffort(level.effort)}
                      onKeyDown={effortRowKeyDown(level.effort)}
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
                          title={isFav
                            ? t('unpinLevel', { model: modelLabel, effort: level.label })
                            : t('pinLevel', { model: modelLabel, effort: level.label })}
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

            {busy && <div className={styles.menuStatus}>{t('pending')}</div>}
            {error !== null && (
              <div className={clsx(styles.menuStatus, styles.menuError)} role="alert">{error}</div>
            )}
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}
