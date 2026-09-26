/**
 * PinMe plugin - Client side entry.
 * Overrides the composer's model seat (`conversation.input.model`) with `PinMeSelect`.
 */

import { PinMeSelect } from './PinMeSelect.js'

export const name = 'pinme'

export const inject = ['slots', 'modelDirectories', 'sessions']

export function apply(ctx: any): void {
  ctx.inject(['slots', 'modelDirectories'], (scope: any) => {
    const models = scope.modelDirectories
    const sessions = scope.sessions

    scope.slots.inject('conversation.input.model', () =>
      scope.slots.register(
        {
          name: 'conversation.input.model',
          locale: 'model',
          inject: (sessionId: string) => {
            const directory = models.directoryFor(sessionId)
            const available = sessions.subagentAddress(sessionId) === undefined
            return {
              available,
              directory: directory.store,
              load: () => {
                if (available) {
                  directory.load().catch(() => {})
                }
              },
              select: (selection: any) =>
                available ? directory.select(selection) : Promise.resolve(undefined),
            }
          },
        },
        PinMeSelect
      )
    )
  })
}
