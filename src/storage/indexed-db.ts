import type { PageSchema } from '@/core'
import type { PageMeta, PageStorage } from './types'

const DB_NAME = 'lowcode'
const DB_VERSION = 1
const STORE = 'pages'

/** 存储记录：把 schema 和索引 meta 一起放，避免 get 时还要扫表 */
interface StoredRecord {
  id: string
  schema: PageSchema
  meta: PageMeta
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      if (db.objectStoreNames.contains(STORE)) {
        resolve(db)
        return
      }
      // 异常态：库存在但缺 store（被无版本号 open 等方式空壳创建过）→ 删库重建
      db.close()
      const del = indexedDB.deleteDatabase(DB_NAME)
      del.onsuccess = () => openDB().then(resolve, reject)
      del.onerror = () => reject(del.error)
      del.onblocked = () => reject(new Error('删除旧库被阻塞'))
    }
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    const req = run(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * 基于 IndexedDB 的 PageStorage 实现。
 * 容量远大于 localStorage（GB 级），异步不阻塞主线程，适合大量页面/大 schema。
 */
export class IndexedDBStorage implements PageStorage {
  async list(): Promise<PageMeta[]> {
    const db = await openDB()
    try {
      const records = await tx<StoredRecord[]>(db, 'readonly', (s) => s.getAll() as IDBRequest<StoredRecord[]>)
      return records
        .map((r) => r.meta)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    } finally {
      db.close()
    }
  }

  async get(id: string): Promise<PageSchema | null> {
    const db = await openDB()
    try {
      const record = await tx<StoredRecord | undefined>(db, 'readonly', (s) => s.get(id) as IDBRequest<StoredRecord | undefined>)
      return record?.schema ?? null
    } finally {
      db.close()
    }
  }

  async save(schema: PageSchema): Promise<void> {
    const db = await openDB()
    try {
      // IDB put 走结构化克隆，不能存响应式 Proxy（Pinia store.schema 直接传会抛
      // "could not be cloned"）。先 JSON 深拷成纯对象，顺便剥离非可序列化字段。
      const plain = JSON.parse(JSON.stringify(schema)) as PageSchema
      const meta: PageMeta = {
        id: plain.id,
        name: plain.name,
        type: plain.type,
        updatedAt: Date.now(),
      }
      await tx(db, 'readwrite', (s) => s.put({ id: plain.id, schema: plain, meta }))
    } finally {
      db.close()
    }
  }

  async remove(id: string): Promise<void> {
    const db = await openDB()
    try {
      await tx(db, 'readwrite', (s) => s.delete(id))
    } finally {
      db.close()
    }
  }
}
