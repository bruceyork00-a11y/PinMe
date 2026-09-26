/**
 * PinMe plugin data types.
 */

export interface ModelFavorite {
  /** Unique composite key: `${provider}/${model}:${reasoningEffort ?? 'default'}` */
  id: string
  /** Provider identifier, e.g. "deepseek-official" */
  provider: string
  /** Model identifier, e.g. "deepseek-v3" */
  model: string
  /** Display name of the model, e.g. "DeepSeek V3" */
  modelName: string
  /** Optional reasoning effort / thinking intensity, e.g. "low" | "medium" | "high" */
  reasoningEffort?: string
  /** Effort label for display, e.g. "High" */
  effortLabel?: string
  /** Short tag label shown on the quick switch pills */
  shortLabel: string
  /** Timestamp when favorited */
  createdAt: number
}
