// dsh-chanhub —— RPC 端点名（与宿主 lib/index.js 的 ENDPOINTS 保持一致）
//
// 为什么单独成文件：用量页拆到 `client/usage/` 后也要用端点名。若它们仍留在
// `client/index.js`，usage/* 就得反向 import 入口 —— 成环，打包后在模块
// 初始化期拿到 undefined。
//
// 新增端点时必须同步三处：本文件、`lib/index.js` 的 ENDPOINTS、宿主 switch。

export const ENDPOINTS = {
  getStatus: 'getStatus',
  refreshStatus: 'refreshStatus',
  getModels: 'getModels',
  getStats: 'getStats',
  probe: 'probe',
  getConfig: 'getConfig',
  saveConfig: 'saveConfig',
  getAccounts: 'getAccounts',
  getCredits: 'getCredits',
  getGrowthTasks: 'getGrowthTasks',
  getSchoolTasks: 'getSchoolTasks',
  getUsage: 'getUsage',
  getLogs: 'getLogs',
  getTasks: 'getTasks',
  runTask: 'runTask',
  growthWrite: 'growthWrite',
  taskScan: 'taskScan',
  taskQueueStart: 'taskQueueStart',
  taskQueueStatus: 'taskQueueStatus',
  schoolStatusAll: 'schoolStatusAll',
  schoolVouchersAll: 'schoolVouchersAll',
  accountMore: 'accountMore',
  accountDisable: 'accountDisable',
  accountEnable: 'accountEnable',
  accountRevive: 'accountRevive',
  loginStart: 'loginStart',
  loginPoll: 'loginPoll',
  loginCallback: 'loginCallback',
  getChannels: 'getChannels',
  serviceControl: 'serviceControl',
  revealApiKey: 'revealApiKey',
};

/** RPC 频道（与宿主 apply 里的 CHANNEL 一致）。 */
export const CHANNEL = '/dsh-chanhub';
