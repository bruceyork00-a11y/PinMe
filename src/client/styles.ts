/**
 * Inlined CSS styles with automatic DOM injection for PinMe.
 * Bypasses bundler CSS loader requirements and guarantees reliable rendering.
 */

const css = `
.pinme-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
}

.pinme-tag-container {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}

.pinme-tag-container::-webkit-scrollbar {
  display: none;
}

.pinme-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
  color: var(--vp-c-text-2, #64748b);
  background-color: var(--vp-c-bg-mute, rgba(148, 163, 184, 0.1));
  border: 1px solid var(--vp-c-divider, rgba(148, 163, 184, 0.2));
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.pinme-tag-pill:hover {
  color: var(--vp-c-brand-1, #0284c7);
  background-color: var(--vp-c-brand-soft, rgba(2, 132, 199, 0.1));
  border-color: var(--vp-c-brand-soft, rgba(2, 132, 199, 0.3));
}

.pinme-tag-pill-active {
  color: var(--vp-c-brand-1, #0284c7);
  background-color: var(--vp-c-brand-soft, rgba(2, 132, 199, 0.15));
  border-color: var(--vp-c-brand-1, #0284c7);
  font-weight: 500;
}

.pinme-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--vp-c-brand-1, #0284c7);
  opacity: 0.6;
}

.pinme-tag-pill-active .pinme-tag-dot {
  opacity: 1;
}

.pinme-tag-text {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pinme-tag-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  margin-left: -2px;
  margin-right: -2px;
  font-size: 13px;
  line-height: 1;
  color: var(--vp-c-text-3, #94a3b8);
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.pinme-tag-pill:hover .pinme-tag-close-btn {
  opacity: 1;
}

.pinme-tag-close-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.pinme-heart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--vp-c-text-3, #94a3b8);
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s, color 0.15s;
  margin-left: auto;
  flex-shrink: 0;
}

.pinme-heart-btn:hover {
  color: #ef4444;
  transform: scale(1.15);
}

.pinme-heart-favorited {
  color: #ef4444 !important;
}

.pinme-heart-favorited svg {
  fill: #ef4444 !important;
}

.pinme-menu-status {
  padding: 6px 10px 2px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--vp-c-text-3, #94a3b8);
}

.pinme-menu-error {
  color: #ef4444;
}

.pinme-tag-error {
  font-size: 11px;
  color: #ef4444;
  white-space: nowrap;
}
`

/**
 * Install the plugin stylesheet as a fiber-managed effect.
 *
 * Returns a disposer that removes the element the caller installed, so the
 * stylesheet follows the plugin's lifecycle (per the DSH docs: anything
 * registered through `ctx` is undone on unload).
 */
export function installStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const existing = document.querySelector('style[data-plugin="dsh-plugin-pinme"]')
  if (existing !== null) return () => {}
  const style = document.createElement('style')
  style.setAttribute('data-plugin', 'dsh-plugin-pinme')
  style.textContent = css
  document.head.appendChild(style)
  return () => { style.remove() }
}

export const styles = {
  wrapper: 'pinme-wrapper',
  tagContainer: 'pinme-tag-container',
  tagPill: 'pinme-tag-pill',
  tagPillActive: 'pinme-tag-pill-active',
  tagDot: 'pinme-tag-dot',
  tagText: 'pinme-tag-text',
  tagCloseBtn: 'pinme-tag-close-btn',
  heartBtn: 'pinme-heart-btn',
  heartFavorited: 'pinme-heart-favorited',
  menuStatus: 'pinme-menu-status',
  menuError: 'pinme-menu-error',
  tagError: 'pinme-tag-error',
}

export default styles
