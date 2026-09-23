# 视觉能力实测（探针）—— 30 个「目录未定」模型

> 生成方式：`probeModelVisionBatch`（`lib/model-probe.js`）对网关逐模型**串行实测**，间隔 700ms。
> 每个模型一张 40×40 的图（背景色 + 白色数字，样本由模型 id 决定、可复现），
> 问「背景是什么颜色？中间的数字是几？」—— **答对才算看见**（盲猜命中率 ≈ 1.7%）。
> 原始结果：`/tmp/probe-results.json`（含每个模型的期望值与证据）。

## 结论分布

| 实测结论 | 数量 | 含义 |
|---|---|---|
| 图（image） | 15 | 答对背景色 + 数字 |
| 文（text） | 3 | 模型自述看不到图 / 上游拒绝图片 |
| 未定（unknown） | 12 | 模型不可用、限流、或答案与图不符 —— **不写配置、不进基线** |

## 逐条

| 模型 | 目录判定 | 目录状态 | 实测 | 在配 | 依据 |
|---|---|---|---|---|---|
| `traework:cn:aquila` | 无收录 | missing | **图** |  | 答对背景色与数字（teal/1）：青色,1 |
| `traework:cn:Doubao-Seed-2.1-Pro` | 图 | borrowed | **图** |  | 答对背景色与数字（orange/0）：橙色,0 |
| `traework:cn:sagitta` | 无收录 | missing | **图** |  | 答对背景色与数字（purple/9）：紫色,9 |
| `traework:cn:seed-code-pro-0430` | 无收录 | missing | **图** |  | 答对背景色与数字（teal/8）：青绿色,8 |
| `workbuddy:cn:deepseek-v3-2-volc` | 文 | borrowed | **图** |  | 答对背景色与数字（orange/2）：橙色,2 |
| `workbuddy:cn:deepseek-v4-flash` | 无收录 | conflict | **图** | ★ | 答对背景色与数字（orange/6）：橙色,6 |
| `workbuddy:cn:glm-5.0-turbo` | 无收录 | missing | **图** |  | 答对背景色与数字（olive/7）：橄榄色,7 |
| `workbuddy:cn:hy3-x` | 文 | borrowed | **图** |  | 答对背景色与数字（purple/4）：紫色,4 |
| `workbuddy:cn:hy4-preview-f` | 文 | borrowed | **图** | ★ | 答对背景色与数字（purple/7）：紫色,7 |
| `workbuddy:cn:kimi-k2.7` | 图 | borrowed | **图** |  | 答对背景色与数字（olive/1）：橄榄色,1 |
| `workbuddy:cn:kimi-k2.8-preview` | 无收录 | missing | **图** | ★ | 答对背景色与数字（teal/6）：青色,6 |
| `workbuddy:cn:kimi-k3-1` | 图 | borrowed | **图** | ★ | 答对背景色与数字（purple/8）：紫色,8 |
| `workbuddy:global:deepseek-v4.1-flash-sg` | 图 | borrowed | **图** |  | 答对背景色与数字（orange/3）：橙色,3 |
| `workbuddy:global:hy4-preview-f` | 文 | borrowed | **图** | ★ | 答对背景色与数字（teal/5）：青色,5 |
| `workbuddy:global:kimi-k2.8-preview` | 无收录 | missing | **图** |  | 答对背景色与数字（teal/5）：青色,5 |
| `traework:cn:explore_sub_agent_v2` | 无收录 | missing | **文** |  | 纯文本可过、带图失败（502 solo error code=3004 msg=We're sorry, your requests have exceeded the rate limit. Please wait a |
| `workbuddy:cn:deepseek-v3-0324-lkeap` | 文 | borrowed | **文** |  | 模型自述看不到图：抱歉，我目前无法查看或分析图片内容。请切换到支持多模态功能的模型，或直接描述图片中的背景颜色和中间的数字。 |
| `workbuddy:cn:deepseek-v3-1-lkeap` | 文 | borrowed | **文** |  | 模型自述看不到图：抱歉，我无法查看图像。当前模型不支持图像处理，请切换到多模态模型或尝试其他方法。 |
| `qoder:work:kimi-k2.8-preview` | 无收录 | missing | **未定** |  | 答案与图不符（期望 olive/1）：绿色,1 |
| `traework:cn:browser_use_subagent` | 无收录 | missing | **未定** |  | 带图与纯文本都失败（图 502 / 文 502），原因不在视觉 |
| `traework:cn:computer_use_subagent` | 无收录 | missing | **未定** |  | 带图与纯文本都失败（图 502 / 文 502），原因不在视觉 |
| `traework:cn:DeepSeek-V4-Flash` | 无收录 | conflict | **未定** |  | 答案与图不符（期望 navy/9）：未知,未知 |
| `traework:cn:DeepSeek-V4-Flash-Official` | 无收录 | conflict | **未定** | ★ | 答案与图不符（期望 navy/1）：无法确定,无法确定 |
| `traework:cn:DeepSeek-V4-Pro-Official` | 文 | borrowed | **未定** | ★ | 答案与图不符（期望 teal/2）：未知,未知 |
| `traework:cn:file_search_agent` | 无收录 | missing | **未定** |  | 带图与纯文本都失败（图 502 / 文 502），原因不在视觉 |
| `workbuddy:cn:deepseek-r1-0528-lkeap` | 文 | borrowed | **未定** |  | 答案与图不符（期望 orange/2）：不支持,0 |
| `workbuddy:cn:deepseek-v3-1-volc` | 文 | borrowed | **未定** |  | 模型不可用：{"code":11102,"msg":"model [deepseek-v3-1-volc] service info not found","requestId":"cb48698cd89479b9d5b |
| `workbuddy:cn:hunyuan-chat` | 无收录 | missing | **未定** |  | 答案与图不符（期望 teal/9）：无法识别，当前模型不支持图片分析。请使用多模态模型或换一种方式描述图片内容。 |
| `workbuddy:cn:hunyuan-image-alpha-edit` | 无收录 | missing | **未定** |  | 带图与纯文本都失败（图 503 / 文 503），原因不在视觉 |
| `workbuddy:cn:kimi-k2-instruct-taiji` | 无收录 | missing | **未定** |  | 模型不可用：{"code":11102,"msg":"model [kimi-k2-instruct-taiji] service info not found","requestId":"7ce2518c36c7871 |

## 要点

- **目录标注「文」但实测「图」：4 个** —— `workbuddy:cn:deepseek-v3-2-volc`、`workbuddy:cn:hy3-x`、`workbuddy:cn:hy4-preview-f`、`workbuddy:global:hy4-preview-f`
- **目录无收录但实测「图」：7 个** —— `traework:cn:aquila`、`traework:cn:sagitta`、`traework:cn:seed-code-pro-0430`、`workbuddy:cn:deepseek-v4-flash`、`workbuddy:cn:glm-5.0-turbo`、`workbuddy:cn:kimi-k2.8-preview`、`workbuddy:global:kimi-k2.8-preview`
- 目录内部冲突（同级平票）：3 个 —— `workbuddy:cn:deepseek-v4-flash`(图)、`traework:cn:DeepSeek-V4-Flash`(未定)、`traework:cn:DeepSeek-V4-Flash-Official`(未定)
- 未定里绝大多数是**与视觉无关**的原因：`service info not found`(code 11102)、限流(3004)、502/503。
- 纪律：unknown 永不写进 `settings.modelCapabilities`；只有 image/text 可沉淀（等级 L0 实测）。

## 方法学（为什么不能只看「请求成不成功」）

- 只发一张图看有没有报错**证明不了任何事**：实测 `workbuddy:cn:hy3`、`workbuddy:cn:glm-5.3`（目录都标「文」）
  带图请求都返回 200，且能答对图里的颜色与数字 —— 图片被静默丢弃时模型照样作答。
- 早期版本发一张 8×8 纯色图问颜色：`glm-5.3` 会**编**一个颜色（「浅灰色」），
  换成 40×40 带数字的图后它答对了 —— 图太小本身也会导致误判。
- thinking 模型会把预算烧在思考上（`content` 空、`reasoning_content` 满）：
  `deepseek-v4.1-flash` 在 `max_tokens=600` 时无正文，放大到 2400 后答对 → 探针内置一次放大重试。
