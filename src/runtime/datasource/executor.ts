import type { DataSourceLoad, DataSourceSubmit } from '@/core'

type Config = DataSourceLoad | DataSourceSubmit

/**
 * 数据源执行器：根据 config 调用 fetch，返回解析后的 JSON。
 * POST/PUT 时把 body JSON 序列化并设置 Content-Type。
 */
export async function exec(config: Config, body?: unknown): Promise<any> {
  const headers: Record<string, string> = {}
  let payload: BodyInit | undefined
  if (body !== undefined && (config.method === 'POST' || config.method === 'PUT')) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(config.url, { method: config.method, headers, body: payload })
  if (!res.ok) throw new Error(`请求失败 ${res.status}: ${config.url}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
