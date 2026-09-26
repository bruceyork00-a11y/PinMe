/**
 * PinMe plugin - Client side entry.
 *
 * Replaces the composer's single model seat (`conversation.input.model`) with
 * `PinMeSelect`, which keeps the native model + thinking-intensity selection and
 * adds favorite presets on top.
 *
 * Per the DSH docs a feature package owns its own locale namespace and undoes
 * every contribution on unload, so the stylesheet and dictionary are registered
 * as effects of this fiber.
 */

import { PinMeSelect } from './PinMeSelect.js'
import { installStyles } from './styles.js'
import { NS, zh, en } from './locales.js'

export const name = 'pinme'

export const inject = ['locale', 'sessions', 'slots', 'remote', 'remote.session']

export function apply(ctx: any): void {
  ctx.inject(['slots', 'modelDirectories', 'locale', 'sessions', 'remote', 'remote.session'], (scope: any) => {
    const models = scope.modelDirectories
    const sessions = scope.sessions

    scope.effect(() => installStyles(), 'pinme: stylesheet')
    scope.effect(() => scope.locale.register(NS, { zh, en }), 'pinme: dictionaries')

    scope.slots.inject('conversation.input.model', () =>
      scope.slots.register(
        {
          name: 'conversation.input.model',
          priority: -100, // Lower priority shadows the built-in priority 0 component
          locale: NS,
          inject: (sessionId: string) => {
            const directory = models.directoryFor(sessionId)
            const available = sessions?.subagentAddress ? sessions.subagentAddress(sessionId) === undefined : true
            return {
              available,
              directory: directory.store,
              load: () => {
                if (available) {
                  directory.load().catch(() => {})
                }
              },
              select: (selection: any) =>
                available ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false),
            }
          },
        },
        PinMeSelect
      )
    )
  })
}
