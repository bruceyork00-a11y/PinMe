/**
 * PinMe-owned locale namespace.
 *
 * Per the DSH plugin docs a feature package owns its own dictionary instead of
 * borrowing another package's namespace, so these strings are registered under
 * `pinme` (see client/index.ts) and the composer seat binds its `t` to it.
 */

export const NS = 'pinme'

export interface PinMeLocale {
  header: string
  model: string
  effort: string
  back: string
  providerDefault: string
  selectModel: string
  pinCurrent: string
  unpinCurrent: string
  pinLevel: string
  unpinLevel: string
  removeTag: string
  switchTo: string
  tagsAria: string
  error: string
  pending: string
}

export const zh: PinMeLocale = {
  header: '模型设置',
  model: '模型',
  effort: '推理等级',
  back: '返回',
  providerDefault: 'Default',
  selectModel: '选择模型',
  pinCurrent: '收藏当前组合 {model}（{effort}）',
  unpinCurrent: '取消收藏当前组合 {model}（{effort}）',
  pinLevel: '收藏 {model}（{effort}）为快捷标签',
  unpinLevel: '取消收藏 {model}（{effort}）',
  removeTag: '移除快捷标签',
  switchTo: '切换到 {model}（{effort}）',
  tagsAria: '收藏模型快捷标签',
  error: '操作失败：{message}',
  pending: '正在切换…',
}

export const en: PinMeLocale = {
  header: 'Model Configuration',
  model: 'Model',
  effort: 'Thinking Intensity',
  back: 'Back',
  providerDefault: 'Default',
  selectModel: 'Select model',
  pinCurrent: 'Pin current combo {model} ({effort})',
  unpinCurrent: 'Unpin current combo {model} ({effort})',
  pinLevel: 'Pin {model} ({effort}) as a quick tag',
  unpinLevel: 'Unpin {model} ({effort})',
  removeTag: 'Remove quick tag',
  switchTo: 'Switch to {model} ({effort})',
  tagsAria: 'Favorite model quick tags',
  error: 'Action failed: {message}',
  pending: 'Switching…',
}
