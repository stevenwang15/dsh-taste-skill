# dsh-taste-skill

**让 coding agent 做网页时先有艺术方向，而不是把见过的页面平均一遍。**

这是 [tasteskill v2](https://github.com/Leonxlnx/taste-skill)（技能名 `design-taste-frontend`）的 DeepSeek Harness 原生封装。装进 profile 后，DSH 的技能目录里多出一项 `design-taste-frontend`：模型按描述自动加载，你也可以输入 `/design-taste-frontend` 直接调用。

它治的病很具体。模型默认做出来的页面是「所有见过的页面的平均值」：居中标语、三行副标题、上方小标签、一排图标卡片、柔和渐变、几根细分割线、等宽字体注释、黄白底配陶土色。单看每条都没错，合起来没有任何一个决定是**为这个客户**做的。

这套技能用四件事替换掉那个平均值：

1. **脚本发方向，不让模型拍脑袋。** 20 个从真实获奖站点研究出来的方向，每次随机发 3 个，模型只能从中挑一个能承载客户自身材料的，而不是选最眼熟的那个。
2. **想法必须来自主体。** 页面的概念句从客户的盘点清单里长出来（名字的意思、所在的街道、那个限制条件、它产出的东西），并用"最近的竞争者"测试：如果这句话换成隔壁那家也成立，它就属于品类，不属于这个客户。
3. **一套硬规范，靠测量而不是靠感觉。** 标题两行以内、不要 eyebrow 小标签、不要等宽字体、不要 01/02/03 编号、不要发丝线、不要渐变、静止元素不要阴影、不要助手配色、图标卡片和玻璃拟态一律不要。
4. **在真浏览器里自检，并看自己的截图返工。** 1440 / 768 / 390 三档量测 + 截图，按评委式评分表挑出最差的三个问题，改完再看，最多三轮。

---

## 它能做什么

### 1. 抽方向：一套研究过的设计库，而不是模型的品味

`scripts/draw.mjs` 从库里发牌：先发 3 个方向让你选，选定后把方向配套的 **hero 构图、版面蓝图、字体系统、配色、摄影参考、动效配方、同类研究站点**一次性发下来。抽取会记住最近用过的，连续几个项目不会长得一样。

### 2. 版面蓝图按"这一节要证明什么"分发

不是一个模板套到底，而是先写论证（每节一条主张 + 证据），再按 section 角色（intro / about / features / list / stats / faq / cta / footer…）分发布局。185 条蓝图里，隔壁两节的构图不会重复。

### 3. 真实照片，带授权与署名

`scripts/assets.mjs` 去 Openverse、Wikimedia Commons、芝加哥艺术博物馆、大都会博物馆搜主体世界的真实照片（老照片、地图、材质特写、版画、同类馆藏），默认只返回可商用的许可（CC0 / 公有领域 / CC BY / CC BY-SA）。`--get` 下载并把标题、作者、许可、来源记进 `assets/credits.json`，`--credits` 打印页脚要用的署名行。视频同理（`--video`，取 720p 以内、附 poster 帧）。

找不到诚实照片的东西，用代码画：主体的物件、它的界面、它的瓷砖。**页面至少要有 4 张真照片**，这条是硬性下限。

### 4. 反套路清单：既是规范，也是可测量的闸门

`scripts/lint.mjs` 静态扫描源码里的禁用模式和套话；`scripts/inspect.mjs` 在真浏览器里量标题行数、字号、实际加载的字体、颜色、分割线、阴影、渐变、对比度、溢出，以及"框"：左右外边距是否相等、有没有整节挤在一边、有没有超过半屏的空白、首屏有没有标题、每节有没有小标题。

有 `FAIL` 就必须改；`WARN` 除非能一句话向设计师解释清楚，否则当错处理。

### 5. 滚动场景与"可以上手的一件事"

有滚动叙事的页面，`scripts/scenes.mjs` 会把每个场景在 0 / 10 … 100% 进度上逐帧拍下来（桌面、手机、减弱动效三套），确认它真的跑起来了，而不是停在第一帧。

每个页面还要求有**一个访客能上手的东西**（不是装饰性动效）：选一种木料看椅子、输入名字看字体、调贷款参数看真实月供。用主体的真实内容做，手机拇指可用，没有脚本时有普通降级。

### 6. 应用界面也管（v2.1）

仪表盘、后台、设置、收件箱这类"人在里面干活"的界面走 `references/app-screens.md` 的独立流程：自己的抽卡（`draw.mjs --app`）、自己的规则（安静的边框、对齐的数字、颜色只花在数据上、手机上导航折叠）、自己的检查（`inspect.mjs --app`）。

---

## 一次构建怎么走

| 步 | 做什么 |
| --- | --- |
| 1 | **盘点**：8–12 个只属于这个客户的东西——名字的意思、地址与街道、数字、那个限制、材质、作息、印刷物 |
| 2 | **写论证**：每节一条主张加证据；没有主张的节直接删掉 |
| 3 | **抽方向**：`draw.mjs` 发 3 个方向，选一个能承载盘点项的，再发完整方向表 |
| 4 | **找想法**：写下"在这个页面上，**〈客户的某样东西〉** 变成了 **〈方向要求的装置〉**"，并用竞争者测试；再定那件可以上手的事 |
| 5 | **写文案**：先文案后版式，标题两行以内，每节内容写满 |
| 6 | **建站**：tokens → 首屏 → 各节蓝图 → 图片 → 上手的东西 → 滚动场景 → 满度 → 框 → 状态与语义 |
| 7 | **过闸**：`lint.mjs` + `inspect.mjs`（有场景再加 `scenes.mjs`），改到 0 FAIL |
| 8 | **看图**：打开每张截图，按评分表逐条打分，改最差的三个问题，最多三轮 |
| 9 | **动效**：签名动作 + 每节入场 + 控件反馈 + 一张会动的照片，全部只动 transform / opacity，并带 `prefers-reduced-motion` 降级 |
| 10 | **汇报**：方向与种子、概念句、最终评分、每张图的出处、哪些是占位素材 |

一次完整构建大约 30–45 分钟、几十万 token，大头是找图/画图和返工。

---

## 内容清单

| 内容 | 数量 | 说明 |
| --- | --- | --- |
| 设计方向 | **20** | 每个方向含想法引擎、构图习惯、适合的行业与语气 |
| Hero 构图 | **58** | |
| 版面蓝图 | **185** | 按 section 角色索引 |
| 字体系统 | **44** | 真实可免费商用的字体 + 尺度与排版参数 |
| 配色 | **56** | 每套含角色与比例，不只是色值 |
| 研究站点 | **202** | 从 247 个精选站点（One Page Love、Awwwards Sites of the Day）蒸馏 |
| 动效配方 | **18** | |
| 应用界面 | **7** 类风格 / **5** 个壳 / **25** 个屏式 | 仪表盘、后台、设置、收件箱… |
| 摄影集 | **19** 组 | 关键词 + 可直接取用的氛围图（picsum / Unsplash） |
| 参考文档 | **11** 篇 | copy、type、colour、layout、imagery、motion、scenes、critique、tells、research、app-screens |
| 脚本 | **6** 个 | draw、assets、lint、inspect、scenes、browser-check（另有零依赖 `lib/`） |
| 评估集 | `evals/evals.json` | 对照测试用的 brief |

---

## 在 DSH 里怎么用

### 安装

```bash
dsh plugin --profile desktop add https://github.com/stevenwang15/dsh-taste-skill.git
```

桌面端也可以在 **设置 → 插件** 里粘贴同一个仓库地址。装完重启 DSH（开了 HMR 的 profile 会热加载），新会话的技能目录里会出现 `design-taste-frontend`。

也可以装 Release 里的 tarball，或从本地目录装：

```bash
dsh plugin --profile desktop add https://github.com/stevenwang15/dsh-taste-skill/releases/download/v2.1.6/dsh-taste-skill-2.1.6.tgz
dsh plugin --profile desktop add ./dsh-taste-skill      # 本地目录
```

### 调用

装好后不用记命令，模型会按描述自己加载：

- 「做一个精品咖啡烘焙的工作室官网，单页，要有真实照片」
- 「这个落地页太像 AI 做的了，看看问题在哪，然后重做视觉」
- 「给我一个 SaaS 后台的仪表盘界面，顺便评审现在这版」

想强制加载就输入 `/design-taste-frontend`。

构建产物落在工作区的 `.taste-skill/`：`direction.json`（方向表）、`history.json`（抽取历史，跨会话避免重复）、`inspect/`（截图与 `report.json`）。

### 环境要求

- **Node 22+**。DSH 内置的 runtime 就是 24.x；插件加载时会把可用的 Node 绝对路径写进技能正文，所以宿主 PATH 上是 Node 20 也不影响。
- **Chrome / Edge / Chromium 可选**。视觉闸门需要它；没有时 `scripts/browser-check.mjs` 会明确报出来，`inspect.mjs` / `scenes.mjs` 会以退出码 2 干净退出，技能走降级路径：只跑 `lint.mjs` 静态检查，并在报告里说明"没有跑视觉检查"。插件不会自动下载浏览器。
- **网络只在找图时需要**（`assets.mjs`）。其余全部离线可用，不装任何依赖、不需要 API key。

---

## 目录结构

```
dsh-taste-skill/
├── package.json                 # dsh.bundle.patch → cordis.patch.yml
├── cordis.patch.yml             # insert: taste-skill
├── index.js                     # ctx.skills.register + 把宿主事实写进技能正文
├── skills/design-taste-frontend/ # 技能本体（与上游同构）
│   ├── SKILL.md                 # 10 步流程、house rules、laws、special cases
│   ├── references/              # 11 篇参考
│   ├── scripts/                 # 6 个脚本 + 零依赖 lib/
│   ├── library/                 # 设计库 JSON
│   ├── assets/                  # base.css / base.js / app.css / charts.js / scenes
│   └── evals/
├── scripts/install-local.sh     # 带备份的本地安装
├── scripts/uninstall-local.sh
└── test/smoke.mjs               # 24 项契约与载荷断言
```

---

## 与上游的关系

技能内容与上游**同构**：`SKILL.md`、`references/`、`library/`、`scripts/`、`assets/` 原样收录（上游 2.1.5，commit `12af471`），只做三处 DSH 侧的必要适配：

| 上游 | 本插件 |
| --- | --- |
| 靠拷贝到 `~/.claude/skills/` 被发现 | bundle 注册：`ctx.skills.register()`，`resourceBase` 指向包内技能目录 |
| 抽取历史写 `~/.taste-skill/history.json` | 写到工作区 `.taste-skill/history.json`（沙箱内可写，按项目隔离） |
| 假定 PATH 上有 Node 22 和 Chrome | 加载时探测 Node 与浏览器，把绝对路径和探测结果写进技能正文；没浏览器时干净退出并降级 |

上游的规则、库和流程不做改动，所以上游更新时替换 `skills/design-taste-frontend/` 即可。

### 版本

| 插件 | 上游技能 | 说明 |
| --- | --- | --- |
| `2.1.6` | `2.1.5` | 当前版本 |

---

## 开发与验证

```bash
npm test              # 24 项断言：导出、注册契约、描述长度、载荷完整性、加载期校验
npm run doctor        # 打印 Node / 浏览器探测结果
npm pack --dry-run    # 检查发布内容
npm pack && ./scripts/install-local.sh desktop   # 装到本机（会先卸旧版再装）
```

`test/smoke.mjs` 里有一条针对 DSH 契约的回归断言值得注意：`ctx.skills.register()` 必须显式带 `source` 字段。少了它，技能**仍然会出现在会话技能目录里**，但真正 `skill(name)` 加载时会抛 `loaded skill "…" source must be a string`——因为 `dsh-skill` 只在加载时校验。

### 跟进上游

```bash
rm -rf skills/design-taste-frontend
cp -R /path/to/taste-skill/skills/taste-skill skills/design-taste-frontend
# 重做两处适配：draw.mjs / lib/app-draw.mjs 的抽取历史路径；inspect.mjs / scenes.mjs 的无浏览器退出
# 更新 package.json 的 version / tasteSkill.upstreamVersion，然后 npm test && npm pack
```

### 卸载

```bash
./scripts/uninstall-local.sh desktop
```

从 `dsh.profile.bundles` 摘掉、`pnpm remove`，并用最近一次 `*.bak-<时间戳>` 恢复 profile 的三个文件。之后重启 DSH。

---

## 许可与署名

- 封装层：MIT。
- 技能本体来自 [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)，MIT，Copyright (c) 2026 Leonxlnx，原样收录于 `skills/design-taste-frontend/`；`LICENSE` 为上游原文。
- 库里的占位照片来自 Unsplash（经 picsum.photos），仅作氛围；`assets.mjs` 找到的图片保留各自许可，必须按 `--credits` 在页面署名。
- 本插件与招商银行、任何被用作设计练习的品牌均无关联。
