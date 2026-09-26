/**
 * PinMe plugin - Client side entry.
 * Overrides the composer's model seat (`conversation.input.model`) with `PinMeSelect`.
 */

import { PinMeSelect } from './PinMeSelect.js'

export const name = 'pinme'

export const inject = ['locale', 'sessions', 'slots', 'remote', 'remote.session']

export function apply(ctx: any): void {
  ctx.inject(['slots', 'modelDirectories', 'locale', 'sessions', 'remote', 'remote.session'], (scope: any) => {
    const models = scope.modelDirectories
    const sessions = scope.sessions

    scope.slots.inject('conversation.input.model', () =>
      scope.slots.register(
        {
          name: 'conversation.input.model',
          priority: -100, // Lower priority shadows the built-in priority 0 component
          locale: 'model',
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
