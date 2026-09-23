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
  discoverModelsForPatch: 'discoverModelsForPatch',
  applyModelsPatch: 'applyModelsPatch',
  getModelRecord: 'getModelRecord',
  rollbackModelsSync: 'rollbackModelsSync',
  clearModelRecord: 'clearModelRecord',
  getModelCatalog: 'getModelCatalog',
  refreshModelCatalog: 'refreshModelCatalog',
  commitModelCapabilities: 'commitModelCapabilities',
  completeModelFields: 'completeModelFields',
  probeModelVision: 'probeModelVision',
  // 多消费者 API Key（「接入方」Tab）：网关 /admin/keys 的 CRUD + rotate；
  // previewApiKey 是宿主**本地**计算（网关没有按 key.id 求值的端点，
  // 而明文只在创建/轮换那一刻出现一次），规则见 lib/model-scope.js。
  getApiKeys: 'getApiKeys',
  createApiKey: 'createApiKey',
  patchApiKey: 'patchApiKey',
  deleteApiKey: 'deleteApiKey',
  rotateApiKey: 'rotateApiKey',
  previewApiKey: 'previewApiKey',
};

/** RPC 频道（与宿主 apply 里的 CHANNEL 一致）。 */
export const CHANNEL = '/dsh-chanhub';
