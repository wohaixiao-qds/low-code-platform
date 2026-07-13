import type { MaterialMeta } from '../schema/types'

interface RegistryEntry<C = unknown> {
  meta: MaterialMeta
  component?: C
}

const store = new Map<string, RegistryEntry>()

export function register<C = unknown>(meta: MaterialMeta, component?: C): void {
  store.set(meta.type, { meta, component })
}

export function getMeta(type: string): MaterialMeta | undefined {
  return store.get(type)?.meta
}

export function resolveComponent<C = unknown>(type: string): C | undefined {
  return store.get(type)?.component as C | undefined
}

export function listByGroup(group: string): MaterialMeta[] {
  return [...store.values()].map((e) => e.meta).filter((m) => m.group === group)
}

export function listAll(): MaterialMeta[] {
  return [...store.values()].map((e) => e.meta)
}

export function clearRegistry(): void {
  store.clear()
}
