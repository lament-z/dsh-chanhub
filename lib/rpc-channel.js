// dsh-chanhub —— 宿主侧 RPC 通道适配层
//
// 为什么需要这个文件（而不是直接 ctx.connection.rpc.handle）：
//   DSH 0.1.5 起 connection.rpc.handle 只允许在宿主 connection 上下文注册，
//   第三方插件拿不到该作用域；等价做法是在插件自身 inject 的 webServer 上
//   注册 prefix 路由，wire 格式保持不变（与 dsh-bridge-gateway 的
//   bridge-rpc.js 同一配方）。
//
// 关键契约（两处极易写错，均有实测证据）：
//   1. 路由 handler 收到的是 node:http 的 IncomingMessage，**没有 .json()**。
//      必须自己收集 chunks → new Request(...) → 交给 fetch 语义的处理器。
//   2. WebServer 的 handler 契约是「owns the full response lifecycle」——
//      它 await handler(req, res) 后**完全丢弃返回值**，也从不读 res.headers。
//      所以返回 Response.json(...) 是无效的，必须把 status/headers/body 写回 res。

/** 请求体上限（对齐 dsh-client-connection 的 buffered 语义；超限 413）。 */
export const MAX_RPC_BODY_BYTES = 8 * 1024 * 1024;

const ENDPOINT_SEGMENT_PATTERN = /^[A-Za-z0-9_$.-]+$/;

/**
 * 从 `<channel>/<endpoint...>` 路径中解出 endpoint。
 * @param channel - RPC 通道名前缀，如 `/dsh-chanhub`。
 * @param pathname - 请求的路径名。
 * @returns endpoint 字符串；不匹配或含非法段时返回 undefined。
 */
export function endpointFromChannelPath(channel, pathname) {
  if (!pathname.startsWith(`${channel}/`)) return undefined;
  const endpoint = pathname.slice(channel.length + 1);
  const segments = endpoint.split('/');
  if (
    segments.some(
      (segment) =>
        segment === '' || segment === '.' || segment === '..' || !ENDPOINT_SEGMENT_PATTERN.test(segment),
    )
  ) {
    return undefined;
  }
  return endpoint;
}

/**
 * 组装 wire 层的 `server-response` 信封。
 * @param rpcId - 客户端请求携带的 correlation id。
 * @param result - `{ok:true,value}` 或 `{ok:false,error}`。
 * @returns 供 HTTP 返回的 Response。
 */
export function fullResponse(rpcId, result) {
  return Response.json({ type: 'server-response', rpcId, result });
}

/**
 * 组装一个失败的 `server-response`。
 * @param rpcId - correlation id。
 * @param error - `{code,message,details?}`。
 * @returns 供 HTTP 返回的 Response。
 */
export function errorResponse(rpcId, error) {
  return fullResponse(rpcId, { ok: false, error });
}

/**
 * 校验并分发一次已解成 Fetch 语义的 RPC 请求。
 * @param channel - 通道名前缀。
 * @param handler - `async (endpoint, payload, signal) => result`。
 * @param request - Fetch 的 Request。
 * @returns Response。
 */
export async function rpcFetch(channel, handler, request) {
  const endpoint = endpointFromChannelPath(channel, new URL(request.url).pathname);
  if (request.method !== 'POST' || endpoint === undefined) {
    return new Response('not found', { status: 404 });
  }
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') {
    return new Response('content type must be application/json', { status: 415 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('body is not JSON', { status: 400 });
  }

  const rawRpcId = body?.rpcId;
  const rpcId = typeof rawRpcId === 'string' && rawRpcId.length > 0 ? rawRpcId : 'invalid-request';

  if (body?.type !== 'client-request' || typeof body?.method !== 'string') {
    return errorResponse(rpcId, {
      code: 'gateway/bad-request',
      message: 'invalid client-request message',
      details: { issues: [] },
    });
  }
  if (body.method !== endpoint) {
    return errorResponse(rpcId, {
      code: 'gateway/bad-request',
      message: `method ${JSON.stringify(body.method)} does not match endpoint ${JSON.stringify(endpoint)}`,
      details: { issues: [] },
    });
  }

  try {
    const result = await handler(endpoint, body.payload, request.signal);
    return fullResponse(rpcId, result);
  } catch (error) {
    return new Response(`handler failure: ${String(error)}`, { status: 500 });
  }
}

/**
 * 把一次 node:http 请求完整地服务掉（认证 → IncomingMessage→Request → 回写 res）。
 *
 * 这是 WebServer route handler 的唯一正确用法：它自己拥有整个响应生命周期，
 * 绝不 return Response。
 *
 * @param req - node:http 的 IncomingMessage。
 * @param res - node:http 的 ServerResponse。
 * @param connection - ctx.connection（提供 requestRejection 认证）。
 * @param channel - 通道名前缀。
 * @param handler - `async (endpoint, payload, signal) => result`。
 * @param options - 可选 `{ logger }`。
 * @returns Promise<void>，resolve 时响应已写出。
 */
export async function serveChannelRequest(req, res, connection, channel, handler, options = {}) {
  const rejection =
    typeof connection?.requestRejection === 'function' ? connection.requestRejection(req) : undefined;
  if (rejection !== undefined) {
    res.writeHead(rejection);
    res.end(rejection === 401 ? 'unauthorized' : 'forbidden');
    return;
  }

  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abort.abort();
  });

  const url = new URL(req.url ?? '/', 'http://dsh.internal');
  const headers = Object.fromEntries(
    Object.entries(req.headers).filter(([, value]) => typeof value === 'string'),
  );

  const chunks = [];
  let received = 0;
  try {
    for await (const chunk of req) {
      received += chunk.byteLength;
      if (received > MAX_RPC_BODY_BYTES) {
        res.writeHead(413, { connection: 'close' });
        res.end();
        req.destroy();
        return;
      }
      chunks.push(chunk);
    }
  } catch (error) {
    options.logger?.warn?.('[dsh-chanhub] failed to read request body: %s', error?.message ?? error);
    if (!res.headersSent) {
      res.writeHead(400);
      res.end();
    }
    return;
  }

  const request = new Request(url, {
    method: req.method ?? 'GET',
    headers,
    ...(chunks.length > 0 ? { body: Buffer.concat(chunks) } : {}),
    signal: abort.signal,
  });

  const response = await rpcFetch(channel, handler, request);

  if (res.headersSent) return;
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  if (response.body === null) {
    res.end();
    return;
  }
  for await (const chunk of response.body) {
    if (!res.write(chunk)) {
      await new Promise((resolve) => {
        const done = () => {
          res.off('drain', done);
          res.off('close', done);
          resolve();
        };
        res.once('drain', done);
        res.once('close', done);
      });
    }
  }
  res.end();
}
