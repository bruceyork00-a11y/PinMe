/**
 * Lightweight classNames combiner for PinMe.
 * Zero external dependencies.
 */
export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export default clsx
