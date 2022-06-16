import type { ClientEvents, ClientOptions as DJSClientOptions } from 'discord.js'
import { Client as DJSClient } from 'discord.js'
import type { Listener } from './utils.js'

type ToListenerEventName<T> = T extends `${infer U}${infer Rest}`
  ? `on${Uppercase<U>}${Rest}` | `once${Uppercase<U>}${Rest}`
  : never

type ToListener<T> = T extends Record<infer U, unknown[]>
  ? { [K in U as ToListenerEventName<K>]: Listener<T[K]> }
  : never

export interface Listeners extends ToListener<ClientEvents> {
}

export interface ClientOptions extends DJSClientOptions, Partial<Listeners> {
  commands?: JSX.Element
}

export function getListenerType(key: keyof Listeners, listeners: Listeners): ['on' | 'once', string, Listener] {
  const listener = listeners[key] as Listener
  if (key.startsWith('once')) {
    return ['once', key[4].toLowerCase() + key.slice(5), listener]
  }
  return ['on', key[2].toLowerCase() + key.slice(3), listener]
}

export function Client(opts: ClientOptions): DJSClient {
  const client = new DJSClient(opts)

  if (opts.commands) {
    (opts.commands as (client: DJSClient) => void)(client)
  }

  for (const key in opts) {
    if (!Object.hasOwn(opts, key)) {
      continue
    }

    if (!key.startsWith('on')) {
      continue
    }

    const [freq, event, listener] = getListenerType(key as keyof Listeners, opts as Listeners)
    client[freq](event, listener)
  }

  return client
}
