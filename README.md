# dsh-taste-skill

把 [tasteskill v2](https://github.com/Leonxlnx/taste-skill)（技能名 `design-taste-frontend`）封装成 **DeepSeek Harness 原生插件**：装进 profile 之后，DSH 的技能目录里会多出一项 `design-taste-frontend`，模型按描述自动加载，也可以由你输入 `/design-taste-frontend` 直接调用。

它解决的问题很具体：模型默认做出来的页面是“所有见过的页面的平均值”——居中标语、三行副标题、上方小标签、一排图标卡片、柔和渐变、细分割线、等宽字体注释。这套技能用研究过的方向库、真实可授权的图片、一份严格的禁用清单，加上**真浏览器截图自检与返工循环**，把页面从“没错但没人做过决定”推到“有艺术方向”。

- 上游仓库：<https://github.com/Leonxlnx/taste-skill>（MIT，作者 Leonxlnx）
- 插件版本：`2.1.6`（跟随上游 `2.1.5`，插件自身的修复单独递增末位）
- 本仓库打包的上游版本：`2.1.5`，上游提交 `12af471`
- 插件包名：`dsh-taste-skill`，插件行 id：`taste-skill`，注册的技能名：`design-taste-frontend`

---

## 为什么不能只是“把 SKILL.md 拷进某个目录”

上游给 Claude Code / Codex / 通用 agent 各有一套安装方式，都假设宿主能读到家目录、能直接跑 `node` 和 Chrome。DSH 的运行模型不一样（workspace 是唯一可写范围、宿主 Node 可能是 20、没有内置浏览器、技能要通过插件层注册），所以这里做了六处适配：

| 上游做法 | DSH 插件里的做法 |
| --- | --- |
| 技能靠拷贝到 `~/.claude/skills/` 被发现 | 插件 bundle：`package.json` + `cordis.patch.yml` + `index.js`，用 `ctx.skills.register()` 注册，`resourceBase` 指向包内的技能目录 |
| 抽取历史写 `~/.taste-skill/history.json` | 改写到 `<当前工作区>/.taste-skill/history.json`（沙箱内可写，且按项目隔离；`TASTE_SKILL_HISTORY` 仍可覆盖） |
| 假定 PATH 上的 `node` 能用 | 加载时探测可用的 Node（宿主 / `~/.dsh` 内置 runtime / app 内置），把**绝对路径**写进技能正文；技能正文同时告诉模型：`node -v` 低于 22 就改用绝对路径，实在找不到就调 `load_workspace_dependencies` |
| 假定装了 Chrome，没装就抛栈 | 新增 `scripts/browser-check.mjs`；`inspect.mjs` / `scenes.mjs` 在无浏览器时**干净退出码 2** 并给出提示，按技能里的 “No Chrome or Node 22” 分支降级为静态 lint |
| 截图后“用你的看图工具打开” | 正文明确要求用 DSH 的 `read_image` 工具看图，交付用 `present` |
| 手动复制安装 | 本地安装脚本 / 插件页 / tarball 三种方式，见下 |

技能正文本身（`SKILL.md` 的 10 步流程、house rules、9 篇 references、1.7 MB 设计库、5 个脚本）保持上游原样，**唯一的正文改动是加载时追加的 “DSH runtime” 一节**（绝对路径、Node、浏览器探测结果）。这样上游升级时替换 `skills/` 目录即可，适配层不用重写。

---

## 安装

前提：DeepSeek Harness Desktop / Web，profile 里已经挂了 `@deepseek-ai/dsh-skill`、`@deepseek-ai/dsh-skill-filesystem`、`@deepseek-ai/dsh-tool-skill`（官方 desktop / web 模板默认都有）。

### 方式 A：从 GitHub 安装（推荐）

```bash
dsh plugin --profile desktop add https://github.com/stevenwang15/dsh-taste-skill.git
```

桌面端也可以在 **设置 → 插件** 里粘贴同一个仓库地址。装完重启（或让 HMR 热加载），新会话的技能目录里会出现 `design-taste-frontend`。

也可以用 GitHub Release 上的 tarball：

```bash
dsh plugin --profile desktop add https://github.com/stevenwang15/dsh-taste-skill/releases/download/v2.1.6/dsh-taste-skill-2.1.6.tgz
```

### 方式 B：本地一键安装（改过代码、想立刻生效时用）

```bash
cd dsh-taste-skill
npm pack                                   # 生成 dsh-taste-skill-2.1.6.tgz
./scripts/install-local.sh desktop         # 或 web
```

脚本会先备份 profile 的 `package.json` / `cordis.patch.yml` / `pnpm-lock.yaml`，然后 `pnpm add file:<tarball>`，最后把 `dsh-taste-skill` 追加进 `dsh.profile.bundles`。

装完 **重启 DeepSeek Harness**（开启 HMR 的 profile 会自动热加载，无需重启）。确认方式：新会话里模型能看到的技能目录应包含 `design-taste-frontend`。

### 方式 C：npm / 本地 tarball / 目录

```bash
# 若之后发布到 npm
dsh plugin --profile desktop add dsh-taste-skill

# 或安装本地 tarball / 目录
dsh plugin --profile desktop add ./dsh-taste-skill-2.1.6.tgz
dsh plugin --profile desktop add ./dsh-taste-skill
```

桌面端也可以在 **设置 → 插件**（或侧栏 Plugins）里安装本地路径并启用。

### 方式 D：手动

```bash
cd ~/.dsh/profiles/desktop
pnpm add file:/绝对路径/dsh-taste-skill-2.1.6.tgz
# 然后把 "dsh-taste-skill" 加进 package.json 的 dsh.profile.bundles 数组
```

---

## 使用

装好后直接在会话里提需求即可，模型会自己加载技能：

- “做一个精品咖啡烘焙的工作室官网，单页，要有真实照片”
- “这个落地页太像 AI 做的了，帮我看一下问题在哪，然后重做视觉”
- “给我一个 SaaS 后台的仪表盘界面，顺便评审一下我现在这版”
- 想强制加载：输入 `/design-taste-frontend`

一次完整构建大致走这些步（细节在 `SKILL.md`）：

1. **盘点**素材：只有这个客户才有的东西（名字、街道、数字、材质、营业时间、那条唯一的约束）。
2. **抽方向**：`scripts/draw.mjs` 从 20 个研究过的方向里发 3 个，你选一个；再抽类型系统、配色、结构、图片、动效。
3. **立概念**：一句话，把客户自己的材料和方向的装置绑在一起。
4. **找真图**：`scripts/assets.mjs` 从 Openverse / Wikimedia Commons / Art Institute of Chicago / The Met 搜开放授权图片，`--get` 下载并记录署名。
5. **建站**：先文案后版式，满内容。
6. **过闸**：`scripts/lint.mjs`（静态禁用清单）+ `scripts/inspect.mjs`（真浏览器 1440 / 768 / 390 量测并截图）。
7. **看图返工**：用 `read_image` 看截图，按 critique 评分表改前三名问题，最多三轮。
8. **汇报**：方向与种子、概念句、最终评分、每张图的署名、哪些是占位素材。

产物都落在工作区的 `.taste-skill/`：`direction.json`（方向表）、`history.json`（抽取历史，跨会话避免重复）、`inspect/`（截图与 `report.json`）。

### 浏览器与 Node

- 视觉闸门（`inspect.mjs` / `scenes.mjs`）需要 **Chrome / Edge / Chromium** 和 **Node 22+**。先用 `node scripts/browser-check.mjs` 探测（退出码 0 = 就绪）。
- **没装浏览器时会优雅降级**：`browser-check.mjs` 报 `found: false`，inspector 以退出码 2 明确失败，技能正文要求模型退回 `lint.mjs` 静态检查，并在报告里说明“没有跑视觉检查”，同时提示你装浏览器或设置 `CHROME_PATH`。插件本身**不会自动下载任何东西**。
- 宿主 PATH 上的 `node` 可能只有 20：技能正文里已经写好了可用 Node 的绝对路径（DSH 内置 runtime 是 24.x），模型会直接用它。

---

## 目录结构

```
dsh-taste-skill/
├── package.json                # dsh.bundle.patch → cordis.patch.yml；engines.node >= 22
├── cordis.patch.yml            # insert: { id: taste-skill, name: dsh-taste-skill }
├── index.js                    # ctx.skills.register(design-taste-frontend) + 运行时事实注入
├── skills/design-taste-frontend/
│   ├── SKILL.md                # 上游技能正文（10 步流程、house rules、laws、special cases）
│   ├── references/             # 9 篇：copy / type / colour / layout / imagery / motion / scenes / critique / tells / app-screens / research
│   ├── scripts/                # draw / assets / lint / inspect / scenes + lib/（零依赖 CDP 客户端与规则）
│   ├── library/                # 1.7 MB 设计库：方向、hero、section、字体、配色、图片、站点、动效、场景、app 样式
│   ├── assets/                 # base.css / base.js / charts.js / app.css / scenes
│   └── evals/evals.json        # 上游给的 6 个对照测试 brief
├── scripts/
│   ├── install-local.sh        # 装进 profile（带备份）
│   ├── uninstall-local.sh      # 移除并回滚
│   └── browser-check.mjs       # 技能内的浏览器/Node 探测（见 skills/.../scripts/）
└── test/smoke.mjs              # 用假的 ctx 验证注册契约
```

## 开发与验证

```bash
# 1. 契约与载荷自检（不需要 DSH 在跑）
npm test                     # node test/smoke.mjs，23 项断言

# 2. 环境探测
npm run doctor               # 打印 Node 版本、浏览器路径、是否就绪

# 3. 打包并检查内容
npm pack --dry-run

# 4. 装到本机 profile（已装过会先卸载旧版再装，避免 tarball 完整性校验冲突）
npm pack && ./scripts/install-local.sh desktop
```

`test/smoke.mjs` 会检查：模块导出（`name` / `inject` / `apply`）、`ctx.skills.register` 收到合法技能、描述长度在目录上限 500 字符内、正文去掉了 frontmatter、DSH runtime 一节已注入、`resourceBase` 指向真实目录且 `references/`、`library/`、`scripts/` 都在。

> **一个 DSH 契约坑（已踩并加回归断言）**：`ctx.skills.register()` 必须在注册对象里显式给 `source`（这里用 `'plugin'`）。少了它，技能**会正常出现在会话技能目录里**，但模型真正 `skill(name)` 加载时抛 `loaded skill "…" source must be a string`——因为 `dsh-skill` 只在加载时校验 `source` / `provider` / `invocation`，注册时不校验。只看“目录里有没有”会漏掉这个错。

### 跟进上游

```bash
# 1. 用上游仓库的新版本替换载荷（保持目录名 design-taste-frontend）
rm -rf skills/design-taste-frontend
cp -R /path/to/taste-skill/skills/taste-skill skills/design-taste-frontend

# 2. 重做两处 DSH 适配
#    - scripts/draw.mjs:111 与 scripts/lib/app-draw.mjs:46 的抽取历史路径（改成工作区 .taste-skill/）
#    - scripts/inspect.mjs / scenes.mjs 的 Browser.launch() 加无浏览器干净退出（退出码 2）

# 3. 更新 package.json 的 version / tasteSkill.upstreamVersion，然后 npm test && npm pack
```

## 卸载 / 回滚

```bash
./scripts/uninstall-local.sh desktop
```

会从 `dsh.profile.bundles` 摘掉、`pnpm remove`，并用最近一次 `*.bak-<时间戳>` 恢复 profile 的三个文件。之后重启 DSH。

## 许可与署名

- 本封装层：MIT。
- 技能本体来自 [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)，MIT，Copyright (c) 2026 Leonxlnx，原样收录于 `skills/design-taste-frontend/`，`LICENSE` 为上游原文。
- 库里的占位照片由 Lorem Picsum 提供（Unsplash 许可）；`assets.mjs` 找到的图片保留各自许可，`--get` 会写入 `assets/credits.json`，页面必须带署名。
