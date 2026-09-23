# 视觉能力实测（探针）—— 全量 107 个模型

> 生成方式：`probeModelVisionBatch`（`lib/model-probe.js`）对网关**逐模型串行实测**，间隔 500–700ms。
> 每个模型一张 40×40 的图（背景色 + 白色数字，样本由模型 id 哈希决定、可复现），
> 问「背景是什么颜色？中间的数字是几？」—— **答对才算看见**（盲猜同时命中 ≈ 3%）。
> 原始数据：`/tmp/probe-results-all.json`。

## 结论分布

| 实测结论 | 数量 | 含义 |
|---|---|---|
| 图（image） | 67 | 数字答对 + 背景色同族 |
| 文（text） | 11 | 模型自述看不到图 / 上游拒绝图片 |
| 未定（unknown） | 29 | 模型不可用、限流、超时、或答案与图不符 —— **不写配置、不进基线** |

## 要点

- **目录标「文」、实测「图」（目录漏判）：17 个**

  - `workbuddy:cn:hy3-x`
  - `workbuddy:cn:hy4-preview-f`
  - `workbuddy:cn:deepseek-v3-2-volc`
  - `workbuddy:global:hy4-preview-f`
  - `workbuddy:cn:hy4-preview`
  - `workbuddy:cn:glm-5.3`
  - `workbuddy:cn:glm-5.2`
  - `workbuddy:cn:glm-5.1`
  - `workbuddy:cn:minimax-m2.7`
  - `workbuddy:cn:deepseek-v4-pro`
  - `qoder:work:qwen3.7-max`
  - `qoder:work:deepseek-v4-pro`
  - `qoder:work:glm-5.3`
  - `qoder:work:glm-5.2`
  - `qoder:work:minimax-m2.7`
  - `workbuddy:global:hy4-preview`
  - `workbuddy:global:hy3`

- **目录无收录（或渠道档位别名）、实测「图」：19 个**

  - `workbuddy:cn:glm-5.0-turbo`
  - `workbuddy:cn:kimi-k2.8-preview`
  - `workbuddy:cn:deepseek-v4-flash`
  - `traework:cn:seed-code-pro-0430`
  - `traework:cn:sagitta`
  - `traework:cn:aquila`
  - `qoder:work:kimi-k2.8-preview`
  - `workbuddy:global:kimi-k2.8-preview`
  - `workbuddy:cn:auto`
  - `workbuddy:cn:fast-model`
  - `workbuddy:cn:balanced-model`
  - `workbuddy:cn:deep-model`
  - `traework:cn:summary`
  - `qoder:work:auto`
  - `workbuddy:global:default-model`
  - `workbuddy:global:fast-model`
  - `workbuddy:global:balanced-model`
  - `workbuddy:global:primary-model`
  - `workbuddy:global:deep-model`

- **目录标「图」、实测「文」（目录错判）：1 个**

  - `workbuddy:global:glm-5.3-flash`

- 未定绝大多数是**与视觉无关**的原因：`service info not found`(11102)、限流(3004)、
  网关 60s 超时、502/503；另有少数「数字答对但颜色不符」的，按纪律记未定。
- 纪律：unknown 永不写进 `settings.modelCapabilities`；只有 image/text 可沉淀（等级 L0 实测）。

## 逐条

| 模型 | 目录判定 | 目录状态 | 实测 | 在配 | 依据 |
|---|---|---|---|---|---|
| `qoder:work:auto` | 无收录 | alias | **图** |  | 答对数字与背景色（teal/9）：青色,9 |
| `qoder:work:deepseek-flash` | 图 | confirmed | **图** | ★ | 答对数字、背景色属同色族（olive/7）：绿色,7 |
| `qoder:work:deepseek-v4-pro` | 文 | confirmed | **图** | ★ | 答对数字与背景色（teal/1）：蓝绿色,1 |
| `qoder:work:glm-5.2` | 文 | confirmed | **图** |  | 答对数字与背景色（orange/8）：橙色,8 |
| `qoder:work:glm-5.3` | 文 | confirmed | **图** | ★ | 答对数字与背景色（teal/8）：青色,8 |
| `qoder:work:glm-5.3-flash` | 图 | confirmed | **图** | ★ | 答对数字与背景色（orange/2）：橙色,2 |
| `qoder:work:kimi-k2.8-preview` | 无收录 | missing | **图** |  | 答对数字、背景色属同色族（olive/1）：绿色,1 |
| `qoder:work:kimi-k3` | 图 | confirmed | **图** | ★ | 答对数字与背景色（purple/5）：紫色,5 |
| `qoder:work:minimax-m2.7` | 文 | confirmed | **图** |  | 答对数字与背景色（orange/8）：橙色,8 |
| `qoder:work:qwen3.7-flash` | 图 | confirmed | **图** |  | 答对数字与背景色（orange/4）：橙色,4 |
| `qoder:work:qwen3.7-max` | 文 | confirmed | **图** | ★ | 答对数字与背景色（navy/7）：深蓝色,7 |
| `qoder:work:qwen3.7-plus` | 图 | confirmed | **图** |  | 答对数字与背景色（navy/3）：深蓝,3 |
| `qoder:work:qwen3.8-flash` | 图 | confirmed | **图** | ★ | 答对数字与背景色（purple/6）：紫色,6 |
| `qoder:work:qwen3.8-max` | 图 | confirmed | **图** | ★ | 答对数字与背景色（purple/4）：紫色,4 |
| `traework:cn:aquila` | 无收录 | missing | **图** |  | 答对数字与背景色（teal/1）：青色,1 |
| `traework:cn:Doubao-Seed-2.1-Pro` | 图 | borrowed | **图** |  | 答对数字与背景色（orange/0）：橙色,0 |
| `traework:cn:Doubao-Seed-Evolving` | 图 | confirmed | **图** |  | 答对数字与背景色（olive/1）：橄榄绿,1 |
| `traework:cn:kimi-k2.6` | 图 | confirmed | **图** |  | 答对数字与背景色（orange/8）：橙色,8 |
| `traework:cn:kimi-k2.7-code` | 图 | confirmed | **图** | ★ | 答对数字与背景色（teal/7）：青色,7 |
| `traework:cn:minimax-m3` | 图 | confirmed | **图** |  | 答对数字与背景色（navy/3）：深蓝色,3 |
| `traework:cn:qwen-3.7-plus` | 图 | confirmed | **图** | ★ | 答对数字与背景色（purple/7）：紫色,7 |
| `traework:cn:qwen3.8-max` | 图 | confirmed | **图** | ★ | 答对数字与背景色（olive/2）：橄榄绿,2 |
| `traework:cn:sagitta` | 无收录 | missing | **图** |  | 答对数字与背景色（purple/9）：紫色,9 |
| `traework:cn:seed-code-pro-0430` | 无收录 | missing | **图** |  | 答对数字与背景色（teal/8）：青绿色,8 |
| `traework:cn:step-5-preview` | 图 | confirmed | **图** |  | 答对数字与背景色（olive/3）：橄榄绿,3 |
| `traework:cn:summary` | 无收录 | alias | **图** |  | 答对数字、背景色属同色族（maroon/6）：红色,6 |
| `workbuddy:cn:auto` | 无收录 | alias | **图** |  | 答对数字与背景色（teal/1）：青色,1 |
| `workbuddy:cn:balanced-model` | 无收录 | missing | **图** |  | 答对数字与背景色（orange/9）：橙色,9 |
| `workbuddy:cn:deep-model` | 无收录 | missing | **图** |  | 答对数字与背景色（navy/9）：深蓝色,9 |
| `workbuddy:cn:deepseek-v3-2-volc` | 文 | borrowed | **图** |  | 答对数字与背景色（orange/2）：橙色,2 |
| `workbuddy:cn:deepseek-v4-flash` | 无收录 | conflict | **图** | ★ | 答对数字与背景色（orange/6）：橙色,6 |
| `workbuddy:cn:deepseek-v4-pro` | 文 | confirmed | **图** | ★ | 答对数字与背景色（purple/0）：紫色,0 |
| `workbuddy:cn:deepseek-v4.1-flash` | 图 | confirmed | **图** | ★ | 答对数字与背景色（purple/2）：紫色,2 |
| `workbuddy:cn:fast-model` | 无收录 | missing | **图** |  | 答对数字与背景色（navy/9）：深蓝色,9 |
| `workbuddy:cn:glm-5.0-turbo` | 无收录 | missing | **图** |  | 答对数字与背景色（olive/7）：橄榄色,7 |
| `workbuddy:cn:glm-5.1` | 文 | confirmed | **图** |  | 答对数字与背景色（teal/1）：青色,1 |
| `workbuddy:cn:glm-5.2` | 文 | confirmed | **图** |  | 答对数字与背景色（maroon/0）：深红色，0 |
| `workbuddy:cn:glm-5.3` | 文 | confirmed | **图** | ★ | 答对数字与背景色（purple/1）：紫色，1 |
| `workbuddy:cn:glm-5.3-flash` | 图 | confirmed | **图** | ★ | 答对数字与背景色（orange/6）：橙色，6 |
| `workbuddy:cn:glm-5v-turbo` | 图 | confirmed | **图** |  | 答对数字与背景色（purple/2）：紫色,2 |
| `workbuddy:cn:hy3-x` | 文 | borrowed | **图** |  | 答对数字与背景色（purple/4）：紫色,4 |
| `workbuddy:cn:hy4-preview` | 文 | confirmed | **图** |  | 答对数字与背景色（navy/5）：深蓝色,5 |
| `workbuddy:cn:hy4-preview-f` | 文 | borrowed | **图** | ★ | 答对数字与背景色（purple/7）：紫色,7 |
| `workbuddy:cn:kimi-k2.5` | 图 | confirmed | **图** |  | 答对数字与背景色（purple/2）：紫色,2 |
| `workbuddy:cn:kimi-k2.6` | 图 | confirmed | **图** |  | 答对数字与背景色（navy/1）：深蓝色,1 |
| `workbuddy:cn:kimi-k2.7` | 图 | borrowed | **图** |  | 答对数字与背景色（olive/1）：橄榄色,1 |
| `workbuddy:cn:kimi-k2.8-preview` | 无收录 | missing | **图** | ★ | 答对数字与背景色（teal/6）：青色,6 |
| `workbuddy:cn:kimi-k3-1` | 图 | borrowed | **图** | ★ | 答对数字与背景色（purple/8）：紫色,8 |
| `workbuddy:cn:minimax-m2.7` | 文 | confirmed | **图** |  | 答对数字与背景色（orange/4）：橙色,4 |
| `workbuddy:cn:minimax-m3` | 图 | confirmed | **图** |  | 答对数字、背景色属同色族（navy/3）：蓝色,3 |
| `workbuddy:global:balanced-model` | 无收录 | missing | **图** |  | 答对数字与背景色（maroon/8）：深红色,8 |
| `workbuddy:global:deep-model` | 无收录 | missing | **图** |  | 答对数字与背景色（orange/7）：颜色,数字：橙色,7 |
| `workbuddy:global:deepseek-v4.1-flash` | 图 | confirmed | **图** | ★ | 答对数字与背景色（teal/6）：青色,6 |
| `workbuddy:global:deepseek-v4.1-flash-sg` | 图 | borrowed | **图** |  | 答对数字与背景色（orange/3）：橙色,3 |
| `workbuddy:global:default-model` | 无收录 | missing | **图** |  | 答对数字与背景色（teal/8）：青色,8 |
| `workbuddy:global:fast-model` | 无收录 | missing | **图** |  | 答对数字与背景色（maroon/3）：深红色,3 |
| `workbuddy:global:gemini-3.5-flash` | 图 | confirmed | **图** | ★ | 答对数字、背景色属同色族（olive/4）：绿色,4 |
| `workbuddy:global:gpt-5.4` | 图 | confirmed | **图** |  | 答对数字与背景色（purple/3）：紫色,3 |
| `workbuddy:global:gpt-5.5` | 图 | confirmed | **图** |  | 答对数字、背景色属同色族（maroon/2）：红色,2 |
| `workbuddy:global:gpt-5.6-sol` | 图 | confirmed | **图** | ★ | 答对数字与背景色（maroon/3）：深红色,3 |
| `workbuddy:global:gpt-6-astra` | 图 | confirmed | **图** | ★ | 答对数字与背景色（maroon/6）：深红色,6 |
| `workbuddy:global:hy3` | 文 | confirmed | **图** | ★ | 答对数字、背景色属同色族（navy/4）：蓝色,4 |
| `workbuddy:global:hy4-preview` | 文 | confirmed | **图** |  | 答对数字与背景色（orange/1）：橙色,1 |
| `workbuddy:global:hy4-preview-f` | 文 | borrowed | **图** | ★ | 答对数字与背景色（teal/5）：青色,5 |
| `workbuddy:global:kimi-k2.6` | 图 | confirmed | **图** |  | 答对数字与背景色（orange/3）：橙色,3 |
| `workbuddy:global:kimi-k2.8-preview` | 无收录 | missing | **图** |  | 答对数字与背景色（teal/5）：青色,5 |
| `workbuddy:global:primary-model` | 无收录 | missing | **图** |  | 答对数字与背景色（navy/5）：深蓝色,5 |
| `traework:cn:explore_sub_agent_v2` | 无收录 | missing | **文** |  | 纯文本可过、带图失败（502 solo error code=3004 msg=We're sorry, your requests have exceeded the rate limit. Please wait and try aga |
| `workbuddy:cn:deepseek-r1-0528-lkeap` | 文 | borrowed | **文** |  | 模型自述看不到图：不支持,0 |
| `workbuddy:cn:deepseek-v3-0324` | 文 | confirmed | **文** |  | 模型自述看不到图：抱歉，我目前无法查看或分析图片内容。请切换到支持多模态功能的模型，或直接描述图片中的背景颜色和中间数字，我会尽力帮你回答。 |
| `workbuddy:cn:deepseek-v3-0324-lkeap` | 文 | borrowed | **文** |  | 模型自述看不到图：抱歉，我目前无法查看或分析图片内容。请切换到支持多模态功能的模型，或直接描述图片中的背景颜色和中间的数字。 |
| `workbuddy:cn:deepseek-v3-1` | 文 | confirmed | **文** |  | 模型自述看不到图：很抱歉，我无法看到您提到的图片。

根据系统提示，我目前不支持图像识别功能。要回答您关于图片背景颜色和中间数字的问题，您可以：

1.  **切换到支持多模态识 |
| `workbuddy:cn:deepseek-v3-1-lkeap` | 文 | borrowed | **文** |  | 模型自述看不到图：抱歉，我无法查看图像。当前模型不支持图像处理，请切换到多模态模型或尝试其他方法。 |
| `workbuddy:cn:hunyuan-2.0-instruct` | 文 | confirmed | **文** |  | 模型自述看不到图：无法查看图片内容，请切换至多模态模型或提供文字描述。 |
| `workbuddy:cn:hunyuan-chat` | 无收录 | missing | **文** |  | 模型自述看不到图：无法识别，当前模型不支持图片分析。请使用多模态模型或换一种方式描述图片内容。 |
| `workbuddy:global:glm-5.2` | 文 | confirmed | **文** |  | 模型自述看不到图：抱歉，我无法查看图片。请切换到支持图像的多模态模型，或尝试其他方式。 |
| `workbuddy:global:glm-5.3` | 文 | confirmed | **文** | ★ | 模型自述看不到图：抱歉，我目前无法查看或处理图片内容。

建议您：
1. **切换到支持多模态的模型**（可以识别图像的AI模型）
2. **文字描述图片内容**，我可以通过文字 |
| `workbuddy:global:glm-5.3-flash` | 图 | confirmed | **文** | ★ | 模型自述看不到图：抱歉，我当前无法查看图片。请您切换到支持多模态（图像识别）的模型，或者用文字描述图片内容，我很乐意帮您分析。 |
| `traework:cn:browser_use_subagent` | 无收录 | missing | **未定** |  | 带图与纯文本都失败（图 502 / 文 502），原因不在视觉 |
| `traework:cn:computer_use_subagent` | 无收录 | missing | **未定** |  | 带图与纯文本都失败（图 502 / 文 502），原因不在视觉 |
| `traework:cn:DeepSeek-V4-Flash` | 无收录 | conflict | **未定** |  | 答案与图不符（期望 navy/9）：未知,未知 |
| `traework:cn:DeepSeek-V4-Flash-Official` | 无收录 | conflict | **未定** | ★ | 答案与图不符（期望 navy/1）：无法确定,无法确定 |
| `traework:cn:DeepSeek-V4-Pro` | 文 | confirmed | **未定** |  | 答案与图不符（期望 olive/2）：未知,未知 |
| `traework:cn:DeepSeek-V4-Pro-Official` | 文 | borrowed | **未定** | ★ | 答案与图不符（期望 teal/2）：未知,未知 |
| `traework:cn:Doubao-Seed-2.0-Code` | 图 | confirmed | **未定** |  | 带图请求失败且无法归因：0 网关请求超时（60000ms）：http://127.0.0.1:7866/v1/chat/completions |
| `traework:cn:Doubao-Seed-2.1-Turbo` | 图 | confirmed | **未定** |  | 带图请求失败且无法归因：0 网关请求超时（60000ms）：http://127.0.0.1:7866/v1/chat/completions |
| `traework:cn:file_search_agent` | 无收录 | missing | **未定** |  | 带图与纯文本都失败（图 502 / 文 502），原因不在视觉 |
| `traework:cn:glm-5` | 文 | confirmed | **未定** |  | 上游临时失败（限流/过载/额度），与视觉无关：solo error code=3004 msg=We're sorry, your requests have exceeded the rate limit. Please wait and |
| `traework:cn:glm-5-turbo` | 文 | confirmed | **未定** |  | 上游临时失败（限流/过载/额度），与视觉无关：solo error code=3004 msg=We're sorry, your requests have exceeded the rate limit. Please wait and |
| `traework:cn:glm-5.2` | 文 | confirmed | **未定** |  | 上游临时失败（限流/过载/额度），与视觉无关：solo error code=3004 msg=We're sorry, your requests have exceeded the rate limit. Please wait and |
| `traework:cn:glm-5.3` | 文 | confirmed | **未定** | ★ | 上游临时失败（限流/过载/额度），与视觉无关：solo error code=3004 msg=We're sorry, your requests have exceeded the rate limit. Please wait and |
| `traework:cn:kimi-k3` | 图 | confirmed | **未定** | ★ | 答案与图不符（期望 olive/9）：绿色,1 |
| `workbuddy:cn:deepseek-r1-0528` | 文 | confirmed | **未定** |  | 模型不可用：{"code":11102,"msg":"model [deepseek-r1-0528] service info not found","requestId":"08bf5c4f375a572c889b7b7ab134d20 |
| `workbuddy:cn:deepseek-v3-1-volc` | 文 | borrowed | **未定** |  | 模型不可用：{"code":11102,"msg":"model [deepseek-v3-1-volc] service info not found","requestId":"cb48698cd89479b9d5b8c4e17699a |
| `workbuddy:cn:default-1.1` | 无收录 | missing | **未定** |  | 模型不可用：{"code":11102,"msg":"model [default-1.1] service info not found","requestId":"18344942cfcb5a7b48316a4875f3400b","d |
| `workbuddy:cn:default-1.2` | 无收录 | missing | **未定** |  | 模型不可用：{"code":11102,"msg":"model [default-1.2] service info not found","requestId":"bf913644901347a55ea74993d2ab13d1","d |
| `workbuddy:cn:glm-4.6` | 文 | confirmed | **未定** |  | 模型不可用：{"code":11102,"msg":"model [glm-4.6] service info not found","requestId":"af1c10f4c82564c56f92daa9c35def82","displ |
| `workbuddy:cn:glm-4.6v` | 图 | confirmed | **未定** |  | 上游临时失败（限流/过载/额度），与视觉无关：all accounts are temporarily unavailable, please retry later |
| `workbuddy:cn:hunyuan-image-alpha-edit` | 无收录 | missing | **未定** |  | 带图与纯文本都失败（图 503 / 文 503），原因不在视觉 |
| `workbuddy:cn:hy3` | 文 | confirmed | **未定** | ★ | 答案与图不符（期望 navy/7）：深蓝色,1 |
| `workbuddy:cn:kimi-k2-instruct-taiji` | 无收录 | missing | **未定** |  | 模型不可用：{"code":11102,"msg":"model [kimi-k2-instruct-taiji] service info not found","requestId":"7ce2518c36c787106efc936f4 |
| `workbuddy:cn:kimi-k2-thinking` | 文 | confirmed | **未定** |  | 模型不可用：{"code":11102,"msg":"model [kimi-k2-thinking] service info not found","requestId":"1755930051c80d62fcc0ab2f52fbcd6 |
| `workbuddy:cn:minimax-m2.5` | 文 | confirmed | **未定** |  | 模型不可用：{"code":11102,"msg":"model [minimax-m2.5] service info not found","requestId":"9f53245ffd06396ee8f2ae0e751cff9c"," |
| `workbuddy:global:gpt-5.3-codex` | 图 | confirmed | **未定** | ★ | 答案与图不符（期望 navy/7）：蓝色,1 |
| `workbuddy:global:gpt-5.6-luna` | 图 | confirmed | **未定** | ★ | 答案与图不符（期望 orange/0）：橙色,1 |
| `workbuddy:global:gpt-5.6-terra` | 图 | confirmed | **未定** | ★ | 答案与图不符（期望 maroon/3）：红色,1 |
| `workbuddy:global:kimi-k3` | 图 | confirmed | **未定** | ★ | 答案与图不符（期望 olive/2）：橄榄绿,5 |
