import { RPCHandler } from '@orpc/server/fetch'
import { onError } from '@orpc/server'
import type { RequestHandler } from './$types'
import { appRouter } from '$lib/orpc/server/router'
import { createOrpcContext } from '$lib/orpc/server/context'

const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
})

const handle: RequestHandler = async (opts) => {
  const { response } = await handler.handle(opts.request, {
    prefix: '/api/rpc',
    context: createOrpcContext(opts)// Provide initial context if needed
  })

  return response ?? new Response('Not Found', { status: 404 })
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle