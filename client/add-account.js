// dsh-chanhub —— 「添加账号」弹窗（浏览器侧）
//
// 为什么需要这个组件：插件此前只有「移除账号」而没有「新增账号」入口，
// 加号只能靠宿主命令行（chanhub/login.sh + 重启）。这里接上网关的
// /panel/api/login/start|poll（OAuth 设备授权），做成面板内闭环。
//
// 交互三段状态机（与网关契约一一对应）：
//   idle    → 选渠道/域，点「获取授权链接」
//   awaiting→ 打开授权链接、浏览器完成登录、面板每 2.5s 轮询 poll
//   done    → 展示 uid/昵称/积分，提示账号已热加载进池
//
// 关键约束：**面板不持有任何登录会话**——会话态（state + realm）在网关侧。
// 面板重启/切 Tab 后重新 poll 仍能拿到结果，故这里不做本地持久化。

import React from 'react';
import { s, tone } from './theme.js';

/** 渠道 → 展示名（与账号池的渠道标签同源口径）。 */
const CHANNEL_LABEL = {
  workbuddy: 'WorkBuddy',
  traework: 'TraeWork',
  qoder: 'QoderWork',
  qodercn: 'QoderCN',
  qodercom: 'QoderCOM',
};

/**
 * 渠道 → 可选域。
 * workbuddy 有 cn/global 两域（域决定上游 base 与凭证 domain）；其余渠道当前仅 cn。
 */
const CHANNEL_REALMS = {
  workbuddy: [
    { id: 'cn', label: '国内版', note: 'copilot.tencent.com' },
    { id: 'global', label: '国际版', note: 'www.workbuddy.ai' },
  ],
  traework: [{ id: 'cn', label: '默认', note: 'trae.cn' }],
  qoder: [{ id: 'cn', label: '默认', note: 'qoder.com.cn' }],
  // QoderCN 与 QoderWork 同域名但为不同产品线（凭据不通用），单独列渠道。
  qodercn: [{ id: 'cn', label: '默认', note: 'qoder.com.cn' }],
  // 国际版：业务 openapi.qoder.sh / 推理 api1.qoder.sh / 模型表 api2.qoder.sh。
  qodercom: [{ id: 'cn', label: '国际版', note: 'openapi.qoder.sh' }],
};

/** 轮询间隔（毫秒）。设备授权是人在浏览器里操作，2.5s 足够快也不打网关。 */
const POLL_INTERVAL_MS = 2500;

/**
 * 轮询上限（次）。15 分钟 × 2.5s = 360 次，与网关侧 traework/qoder 的 TTL 对齐：
 * 网关自己会在 TTL 后回 error，这里是第二道保险（旧网关没有 TTL）。
 */
const MAX_POLL_ATTEMPTS = 360;

/**
 * 单行单选按钮组。
 * @param props - `{label, options, value, onChange}`。
 * @returns React 元素。
 */
function RadioRow({ label, options, value, onChange }) {
  return React.createElement(
    'div',
    { className: 'dshc-row', style: { marginBottom: 10 } },
    React.createElement('span', { style: { ...s.muted, width: 52, flexShrink: 0 } }, label),
    ...options.map((option) =>
      React.createElement(
        'button',
        {
          key: option.id,
          type: 'button',
          className: `dshc-choice${option.id === value ? ' on' : ''}`,
          disabled: options.length === 1,
          title: option.note,
          onClick: () => onChange(option.id),
        },
        option.label,
        option.note ? React.createElement('span', { className: 'dshc-choice-note' }, option.note) : null,
      ),
    ),
  );
}

/**
 * 「添加账号」弹窗。
 *
 * @param props - `{channels, realms, onStart, onPoll, onCallback, onClose, onDone, knownUids}`。
 *   - channels：网关支持**交互登录**的渠道（来自 /panel/api/channels，不是协议全集）；
 *   - realms：网关声明的域集合（当前恒含 cn）；
 *   - onStart(channel, realm, callbackBase) → `{url, callback_url?, external?}`；
 *   - onPoll(channel) → `{status,...}`；
 *   - onCallback(channel, callback) → `{status:'received'|'error'}`（粘贴完成）；
 *   - onDone()：登录成功后回调（面板据此刷新账号池）；
 *   - knownUids：发起登录那一刻池中已有的 uid 列表。用于在 done 阶段区分「新增账号」
 *     与「同一个号重新登录」—— 两者都回 status=done，若一律写「已添加」，用户会以为
 *     反复登录能不断加出新号（实测踩到：同一 uid 被回「已添加」5 次，用户据此得出
 *     「保存成功了却没显示出来」）。
 * @returns React 元素。
 */
export function AddAccountDialog({
  channels,
  realms,
  onStart,
  onPoll,
  onCallback,
  onClose,
  onDone,
  knownUids,
}) {
  // 默认选中第一个可用渠道，且必须是**真的能登录**的（旧网关的 workbuddy 会 400）。
  const available = Array.isArray(channels) && channels.length > 0 ? channels : [];
  const [channel, setChannel] = React.useState(available[0] ?? '');
  const [realm, setRealm] = React.useState('cn');
  const [phase, setPhase] = React.useState('idle');
  const [url, setUrl] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);
  // 远端必然到不了的回调地址（Trae 授权页硬性要求 127.0.0.1），
  // 由网关在 start 响应里回传，用于提示用户「地址栏里那段复制回来」。
  const [callbackUrl, setCallbackUrl] = React.useState('');
  const [needsPaste, setNeedsPaste] = React.useState(false);
  const [pasted, setPasted] = React.useState('');
  const [pasting, setPasting] = React.useState(false);
  const [pasteError, setPasteError] = React.useState('');
  const timer = React.useRef(null);
  // 本轮已轮询次数（每次发起/换渠道归零）。用于兜住「永远 pending」。
  const attempts = React.useRef(0);
  // poll 世代号：换渠道/重新发起后，丢弃前一轮在途的 poll 结果
  //（否则上一轮的 done 会覆盖新一轮的 idle）。与主面板的 creditsGeneration 同手法。
  const generation = React.useRef(0);
  // 「发起登录那一刻」的池内 uid 冻结快照（点在按钮上时取，而不是渲染时取）：
  // done 阶段若 uid 已在其中 = 这次登录只是给已有账号换凭证，没有新增账号。
  // null = 调用方没给清单，判断不了（不要用空集合冒充「池子是空的」）。
  const knownAtStart = React.useRef(null);

  /** 清掉在途轮询（切渠道、重发起、卸载都必须调用，否则定时器泄漏）。 */
  const stopPolling = React.useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  React.useEffect(() => stopPolling, [stopPolling]);

  const pollOnce = React.useCallback(
    (gen) => {
      timer.current = setTimeout(async () => {
        if (generation.current !== gen) return;
        // 轮询上限：网关侧 TTL 是 15 分钟，超过还拿不到结果说明这条登录已经废了
        // （回调没回来 / 上游卡住 / 网关版本过旧静默回落本地监听）。
        // 没有上限时面板会永远显示「等待授权完成」，用户只能自己猜哪里错了。
        attempts.current += 1;
        if (attempts.current > MAX_POLL_ATTEMPTS) {
          setPhase('error');
          setError(
            `等待超时（约 ${Math.round((MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 60000)} 分钟未完成）。` +
              '若浏览器已提示「无法访问此网站」，说明 Trae 未能自动跳回面板 —— 请用上方的「粘贴回调链接」完成登录，或重新发起。',
          );
          return;
        }
        try {
          const res = await onPoll(channel);
          if (generation.current !== gen) return;
          if (res?.ok === false) {
            setPhase('error');
            setError(res.error?.message ?? '轮询失败');
            return;
          }
          const value = res?.value ?? {};
          if (value.status === 'done') {
            setPhase('done');
            setResult(value);
            setMessage(value.checkin_message || '');
            // 已进池（网关侧落盘 + pool.Add），立刻刷新账号列表让新号可见。
            void onDone?.();
            return;
          }
          if (value.status === 'error') {
            setPhase('error');
            setError(value.error ?? '登录失败');
            return;
          }
          setPhase('awaiting');
          pollOnce(gen); // 继续轮询
        } catch (err) {
          if (generation.current !== gen) return;
          setPhase('error');
          setError(err?.message ?? String(err));
        }
      }, POLL_INTERVAL_MS);
    },
    [channel, onPoll, onDone],
  );

  /** 发起登录：拿授权 URL → 打开浏览器 → 起轮询。 */
  const start = React.useCallback(async () => {
    stopPolling();
    generation.current += 1;
    const gen = generation.current;
    attempts.current = 0;
    // 冻结「此刻池内已有的 uid」：done 阶段据此区分新增账号与同号重登。
    // 必须在发起这一刻取，不能用完成时的列表 —— 完成时新号已经进去了，
    // 再比就会把新增误判成已存在。没传清单则记 null（判断不了）。
    knownAtStart.current = Array.isArray(knownUids) ? new Set(knownUids) : null;
    setPhase('idle');
    setError('');
    setResult(null);
    setCallbackUrl('');
    setPasted('');
    setPasteError('');
    setMessage('正在获取授权链接…');
    try {
      const res = await onStart(channel, realm);
      if (res?.ok === false) {
        setPhase('error');
        setMessage('');
        setError(res.error?.message ?? '发起登录失败');
        return;
      }
      const value = res?.value ?? {};
      if (typeof value.url !== 'string' || value.url === '') {
        setPhase('error');
        setMessage('');
        setError('网关未返回授权链接');
        return;
      }
      setUrl(value.url);
      setMessage('');
      setPhase('awaiting');
      // traework：回调被 Trae 限制为 127.0.0.1（远端打不开），必须走粘贴。
      setNeedsPaste(value.needs_paste === true);
      setCallbackUrl(typeof value.callback_url === 'string' ? value.callback_url : '');
      // 自动在宿主浏览器打开新标签页。window.open 可能被拦截（非用户手势链
      // 之外的调用），故链接始终可见可点，不依赖自动打开成功。
      if (typeof window !== 'undefined') window.open(value.url, '_blank', 'noopener,noreferrer');
      pollOnce(gen);
    } catch (err) {
      setPhase('error');
      setMessage('');
      setError(err?.message ?? String(err));
    }
  }, [channel, realm, onStart, pollOnce, stopPolling, knownUids]);

  /**
   * 粘贴兜底：把用户从地址栏复制的回调交给网关。
   *
   * 为什么需要它：Trae 授权页可能拒绝把浏览器跳到非 loopback 地址
   * （官方客户端只用 127.0.0.1），此时自动跳转到不了面板。用户手工复制
   * 地址栏内容即可完成 —— 走的仍是同一个网关回调入口，不是另一套实现。
   */
  const submitPasted = React.useCallback(async () => {
    const raw = pasted.trim();
    if (raw === '') {
      setPasteError('请先粘贴回调链接（浏览器地址栏里的完整地址）');
      return;
    }
    setPasting(true);
    setPasteError('');
    try {
      const res = await onCallback?.(channel, raw);
      if (res?.ok === false) {
        setPasteError(res.error?.message ?? '提交失败');
        return;
      }
      const value = res?.value ?? {};
      if (value.status !== 'received') {
        setPasteError(value.error ?? '网关未接受该回调');
        return;
      }
      // 提交成功：不把 phase 直接置 done —— 让轮询走完正常流程（网关此刻才真正
      // 拿凭证去换 token + 查账号，done 是那一步的结果）。给用户即时反馈，
      // 免得以为没反应而重复点击。
      setPasted('');
      setMessage('回调已提交，正在换取凭证…');
    } catch (err) {
      setPasteError(err?.message ?? String(err));
    } finally {
      setPasting(false);
    }
  }, [pasted, onCallback, channel]);

  // 关闭时必须在途轮询先停：否则弹窗卸载后定时器仍触发 setState。
  const close = React.useCallback(() => {
    generation.current += 1;
    stopPolling();
    onClose();
  }, [onClose, stopPolling]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  if (available.length === 0) {
    return React.createElement(
      'div',
      null,
      React.createElement('div', { className: 'dshc-drawer-mask', onClick: close }),
      React.createElement(
        'div',
        { className: 'dshc-dialog' },
        React.createElement('button', { type: 'button', className: 'dshc-drawer-close', onClick: close, title: '关闭' }, '✕'),
        React.createElement('div', { style: { ...s.label, marginBottom: 8 } }, '添加账号'),
        React.createElement('div', { style: s.warn },
          '网关未提供可用的登录渠道 —— 需在 chanhub 侧启用 /panel/api/login/*（含 workbuddy 分支）。',
          '升级网关后重新打开本弹窗。'),
      ),
    );
  }

  const realmOptions = CHANNEL_REALMS[channel] ?? [{ id: 'cn', label: '默认', note: '' }];
  // 网关声明的 realms 是权威：CHANNEL_REALMS 是展示信息，二者取交集避免列出
  // 网关明确不支持的域（如 config 关闭 global 时）。
  const allowedRealms = Array.isArray(realms) && realms.length > 0 ? realms : ['cn'];
  const visibleRealmOptions = realmOptions.filter((o) => allowedRealms.includes(o.id));

  // 「新增」还是「同号重登」：网关新版本会在 done 里带 existing（权威口径），
  // 旧网关没有该字段 → 回落到发起登录那一刻的池内 uid 快照（只有拿到清单时才敢判）。
  // undefined = 判断不了 → 退回中性文案「已添加」，不编造结论。
  const existingAccount = typeof result?.existing === 'boolean'
    ? result.existing
    : result?.uid && knownAtStart.current
      ? knownAtStart.current.has(result.uid)
      : undefined;

  return React.createElement(
    'div',
    null,
    React.createElement('div', { className: 'dshc-drawer-mask', onClick: close }),
    React.createElement(
      'div',
      { className: 'dshc-dialog', role: 'dialog', 'aria-label': '添加账号' },
      React.createElement('button', { type: 'button', className: 'dshc-drawer-close', onClick: close, title: '关闭' }, '✕'),
      React.createElement('div', { style: { ...s.label, marginBottom: 12 } }, '添加账号'),

      // 表单（awaiting 之后锁住，避免中途换渠道导致 state 对不上）
      React.createElement(RadioRow, {
        label: '渠道',
        options: available.map((id) => ({ id, label: CHANNEL_LABEL[id] ?? id })),
        value: channel,
        onChange: (id) => {
          setChannel(id);
          // 换渠道必须丢弃上一轮的 URL/轮询：state 是渠道相关的。
          generation.current += 1;
          attempts.current = 0;
          stopPolling();
          setPhase('idle');
          setUrl('');
          setResult(null);
          setError('');
          setCallbackUrl('');
                setPasted('');
          setPasteError('');
        },
      }),
      React.createElement(RadioRow, {
        label: '域',
        options: visibleRealmOptions,
        value: realm,
        onChange: (id) => {
          setRealm(id);
          generation.current += 1;
          attempts.current = 0;
          stopPolling();
          setPhase('idle');
          setUrl('');
          setResult(null);
          setError('');
          setCallbackUrl('');
                setPasted('');
          setPasteError('');
        },
      }),

      phase === 'idle'
        ? React.createElement(
            'button',
            { type: 'button', style: { ...s.btnPri, width: '100%', justifyContent: 'center', marginTop: 4 }, onClick: start },
            message || '获取授权链接',
          )
        : null,

      // 授权链接：无论自动打开是否成功，链接始终可见可复制。
      phase === 'awaiting' || phase === 'done'
        ? React.createElement(
            'div',
            { style: { ...s.tip, marginTop: 8 } },
            React.createElement('div', { style: { marginBottom: 6 } },
              phase === 'awaiting'
                ? (needsPaste
                    ? '① 在新打开的页面完成登录　② 按下方说明把地址栏内容粘回来'
                    : '① 在新打开的页面完成登录　② 回到本面板，无需其他操作')
                : '登录已完成，以下链接已失效。'),
            React.createElement('a', {
              href: url,
              target: '_blank',
              rel: 'noopener noreferrer',
              style: { ...s.code, color: tone.info.fg, display: 'block', wordBreak: 'break-all' },
            }, url),
          )
        : null,

      phase === 'awaiting'
        ? React.createElement('div', { className: 'dshc-row', style: { marginTop: 10, gap: 6 } },
            React.createElement('span', { className: 'dshc-spinner' }),
            React.createElement('span', { style: s.muted }, '等待授权完成…（每 2.5 秒自动检查）'))
        : null,

      // 粘贴完成（traework）。Trae 授权页硬性要求回调地址为
      // http://127.0.0.1:<端口>/authorize，远端浏览器**必然**打不开该地址，
      // 但登录成功后地址栏里就带着凭证 —— 复制回这里即可完成。
      //
      // 常驻渲染（不只在超时后）：这个「打不开」是必然发生的，不是异常情况，
      // 等超时才提示等于让用户先困惑一次。
      (phase === 'awaiting' || phase === 'error') && needsPaste
        ? React.createElement(
            'div',
            { style: { ...s.tip, marginTop: 10 } },
            React.createElement('div', { style: { marginBottom: 6 } },
              '把浏览器地址栏里的内容复制到下面完成登录：'),
            React.createElement('div',
              { style: { ...s.muted, marginBottom: 6 } },
              '登录成功后浏览器会跳到一个打不开的地址（这是 Trae 的限制，不是故障）。',
              '那个页面的**地址栏里带着登录凭证** —— 整段复制过来即可。'),
            React.createElement('div',
              { style: { ...s.muted, marginBottom: 8, wordBreak: 'break-all' } },
              `你会看到的地址形如：${callbackUrl || 'http://127.0.0.1:<端口>/authorize'}?refreshToken=…`),
            React.createElement('textarea', {
              value: pasted,
              onChange: (e) => { setPasted(e.target.value); if (pasteError) setPasteError(''); },
              placeholder: '粘贴地址栏里的完整地址',
              rows: 2,
              spellCheck: false,
              style: {
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                fontSize: 11,
                padding: '6px 8px',
                resize: 'vertical',
                marginBottom: 8,
              },
            }),
            React.createElement(
              'button',
              {
                type: 'button',
                disabled: pasting || pasted.trim() === '',
                style: { ...s.btnGhost, width: '100%', justifyContent: 'center' },
                onClick: submitPasted,
              },
              pasting ? '提交中…' : '提交并完成登录',
            ),
            pasteError
              ? React.createElement('div', { style: { ...s.err, marginTop: 6 } }, pasteError)
              : null,
            React.createElement('div', { style: { ...s.muted, marginTop: 6 } },
              '提示：该地址包含一次性登录凭证，仅提交给本网关，勿转发他人。'),
          )
        : null,

      phase === 'done' && result
        ? React.createElement(
            'div',
            { style: { ...s.card, marginTop: 12, marginBottom: 0, padding: '12px 14px' } },
            React.createElement('div', { className: 'dshc-row', style: { gap: 8, marginBottom: 6 } },
              React.createElement('span', { style: { ...s.label } },
                existingAccount === true
                  ? '✓ 账号已存在'
                  : existingAccount === false
                    ? '✓ 已新增账号'
                    : '✓ 已添加'),
              result.nickname
                ? React.createElement('span', { style: s.muted }, result.nickname)
                : null,
              result.realm
                ? React.createElement('span', { style: s.muted }, result.realm === 'global' ? '国际版' : '国内版')
                : null,
            ),
            React.createElement('div', { style: s.muted },
              React.createElement('div', null, `UID　${result.uid}`),
              typeof result.credits === 'number' && result.credits >= 0
                ? React.createElement('div', null, `积分　${result.credits}`)
                : null,
              // 「同号重登」必须说清没有新增 —— 否则用户反复登录、每次都看到「已添加」，
              // 却数不到新账号，只会得出「保存成功了但没显示」的结论（实测踩到）。
              React.createElement('div', null,
                existingAccount === true
                  ? '该账号此前已在池中：本次只是重新登录并更新了凭证，没有新增账号。'
                  : '凭证已落盘并热加载进池，无需重启网关。'),
            ),
            message ? React.createElement('div', { style: { ...s.muted, marginTop: 6 } }, message) : null,
          )
        : null,

      phase === 'error'
        ? React.createElement('div', { style: { marginTop: 10 } },
            React.createElement('div', { style: s.err }, error),
            React.createElement('button', {
              type: 'button',
              style: { ...s.btnGhost, marginTop: 8, width: '100%', justifyContent: 'center' },
              onClick: () => { setPhase('idle'); setError(''); },
            }, '重新开始'))
        : null,
    ),
  );
}
