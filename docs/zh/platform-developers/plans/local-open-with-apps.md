# 本地模式「打开目录」多应用支持方案（设计与规划）

## 背景

当前本地模式仅提供固定的“Open in VS Code”按钮，通过 `vscode://` URL Scheme 打开目录。这个方案存在明显限制：

- 只能打开 VS Code，无法选择其他编辑器或 IDE（如 PyCharm、WebStorm、Eclipse、Cursor）
- 无法调用系统文件管理器（Finder/Explorer）
- 依赖浏览器 URL Scheme，兼容性与可控性有限

希望在本地模式下扩展为“打开方式”能力，让用户可选择本机已安装的任意可打开目录的程序。

## 目标

- 本地模式支持“打开目录”多应用选择（IDE/编辑器/文件管理器）
- App 侧自动展示本机可用的打开方式
- 浏览器侧统一使用 URL Scheme 打开已知应用
- CLI 侧负责协议探测与兜底打开（系统选择器/文件管理器）
- 保持云端模式不暴露本地打开能力

## 非目标

- 不在云端模式执行打开命令
- 不处理应用安装、下载或版本管理
- 不支持打开任意文件（仅限工作目录/任务目录）
- 不在本阶段实现权限系统的复杂授权 UI

## 现状梳理

- App 侧 `OpenWithVSCodeButton` + `openInVSCode` 使用 `vscode://file/${path}`
- 本地模式检测依赖 CLI Control Server `GET /ping`
- Control Server 暂无“打开目录”接口

## 总体方案

### 架构概览

- **App**：展示“打开方式”菜单；`scheme` 类型直接在浏览器侧打开；`cli` 类型调用 CLI Control Server
- **CLI**：提供 `GET /openers` 返回可用的 scheme/cli 打开方式；`POST /open` 负责系统选择器或文件管理器打开

### App 交互设计

- 将 `OpenWithVSCodeButton` 升级为 `OpenWithAppMenu`
- 本地模式检测通过后，展示“Open With”按钮与可选列表
- 菜单内 `scheme` 类型（如 VS Code/Cursor）直接在浏览器侧触发
- “Open With...” 入口调用 CLI 打开系统选择器（best-effort）
- 文件管理器入口独立保留，与 “Open With...” 并列展示
- 若 CLI 未返回 `open-with`，则隐藏该入口，文件管理器入口仍保留
- 选项示例：
  - Finder / Explorer / Files
  - VS Code
  - Cursor
  - PyCharm / WebStorm / IntelliJ IDEA
  - Eclipse

### CLI 接口设计

#### `GET /openers`

返回当前系统可用的打开方式列表：

```

> 注：CLI 默认仅返回 `supported=true` 的项，`supported=false` 仅用于调试或日志输出。
{
  "openers": [
    { "id": "open-with", "label": "Open With...", "kind": "system", "method": "cli",
      "supported": true },
    { "id": "finder", "label": "Finder", "kind": "file-manager", "method": "cli",
      "supported": true },
    { "id": "vscode", "label": "VS Code", "kind": "editor", "method": "scheme",
      "urlTemplate": "vscode://file/{path}", "supported": true }
  ]
}
```

#### `POST /open`

```
{
  "path": "/path/to/workspace",
  "openerId": "open-with"
}
```

CLI 负责验证路径并执行系统命令（仅限 `method=cli` 的 opener）。

## 模块设计（细化）

### App

- `OpenWithAppMenu`：菜单渲染与交互层（scheme 直跳 / cli 调用）
- `openersStore`：本地模式下拉取 `GET /openers`，并做排序/过滤
- `openWithScheme(urlTemplate, path)`：浏览器侧 scheme 打开能力
- `openWithCli(openerId, path)`：调用 CLI `POST /open`

### CLI

- `openersRegistry`：维护内置 opener 列表（按平台预置）
- `schemeDetector`：探测 URL Scheme 是否注册（macOS/Windows/Linux 实现）
- `cliOpeners`：系统文件管理器 / Open With 选择器能力检测
- `openDispatcher`：根据 `openerId` 执行实际打开命令
- `openersCache`：结果缓存与 TTL 管理

### Shared（可选）

- `Opener` 数据结构：`id/label/kind/method/urlTemplate/supported`
- `OpenRequest` 数据结构：`path/openerId`

## 数据流（细化）

### 获取可用打开方式

1. App 启动本地模式探测（`GET /ping`）。
2. App 请求 CLI `GET /openers`。
3. CLI 执行 scheme 探测与 CLI 能力判断，生成可用列表。
4. CLI 返回 openers（仅 `supported=true`）。
5. App 渲染菜单与按钮。

### Scheme 打开流程

1. 用户点击某个 `method=scheme` 的 opener。
2. App 按 `urlTemplate` 生成 scheme URL。
3. 浏览器触发 `window.location` 跳转。
4. 系统弹出确认或直接打开目标应用。

### CLI 打开流程（文件管理器 / Open With...）

1. 用户点击 `method=cli` 的 opener。
2. App 调用 `POST /open`，携带 `path/openerId`。
3. CLI 校验路径安全性并执行系统命令。
4. 系统打开文件管理器或应用选择器。

## 打开方式枚举与执行策略

### CLI 侧探测流程（建议）

1. 维护内置 opener 列表（按平台预置 id/label/kind/method/urlTemplate）。
2. 对 `method=scheme` 的 opener 探测系统是否已注册 URL Scheme，未注册则过滤。
3. 对 `method=cli` 的 opener 判断系统能力（是否支持“应用选择器”/文件管理器），不支持则不返回。
4. 按优先级排序（系统选择器 → 文件管理器 → 常见编辑器/IDE），返回给 App。
5. 结果可在 CLI 进程内缓存（如 30s/60s TTL），避免频繁扫描系统。

### 平台探测建议

- **macOS**
  - 从 LaunchServices 的 `LSHandlers` 读取 `LSHandlerURLScheme` 判断是否存在 scheme 处理器。
  - “Open With...” 可用 `osascript -e 'set app to choose application'` 选择应用，再 `open -a` 打开目录。

- **Windows**
  - 通过注册表查询 `HKCR\\<scheme>\\shell\\open\\command`/`HKCU\\Software\\Classes` 判断 scheme 是否注册。
  - “Open With...” 可尝试 `Start-Process -Verb OpenAs`（对目录支持因系统而异，需兜底）。

- **Linux**
  - 使用 `xdg-settings get default-url-scheme-handler <scheme>` 或 `gio mime x-scheme-handler/<scheme>` 判断注册情况。
  - “Open With...” 可尝试 `gio open --ask <path>`（依赖桌面环境，需兜底）。

### 预置 Scheme 模板（示例）

- **VS Code**：`vscode://file/{path}`
- **Cursor**：`cursor://file/{path}`
- **JetBrains 系列**：`idea://` / `pycharm://` 等（以官方文档为准）

### 已验证的 Scheme 列表（可优先支持）

- **VS Code**：`vscode://file/{path}`（macOS/Windows/Linux）
- **Cursor**：`cursor://file/{path}`（macOS/Windows）
- **JetBrains 系列**：`idea://open?file={path}`（macOS/Windows）
- **JetBrains 系列**：`pycharm://open?file={path}`（macOS/Windows）

### CLI 兜底打开（示例）

- **macOS**
  - 文件管理器：`open <path>`
  - 应用选择器：`osascript -e 'set app to choose application'` + `open -a "$app" <path>`

- **Windows**
  - 文件管理器：`explorer <path>`
  - 应用选择器：`Start-Process -Verb OpenAs <path>`（若目录不支持则隐藏）

- **Linux**
  - 文件管理器：`xdg-open <path>` 或 `gio open <path>`
  - 应用选择器：`gio open --ask <path>`（依赖桌面环境）

> 注：目录级“Open With...”的 best-effort 表示并非所有系统或桌面环境都支持对目录弹出“选择应用”对话框，CLI 只能尝试调用系统命令；若失败就不返回该入口，文件管理器入口仍保留。

## 权限与安全

- `POST /open` 仅允许本地模式使用
- 仅允许打开当前任务的工作目录（cwd）或其子目录
- 建议增加 `controlToken`（由 CLI 生成、API 下发）作为请求校验
- 启用 CORS 但需校验 `Origin` / token，防止恶意站点调用

## 影响面与模块改动

### App

- 替换 `OpenWithVSCodeButton` 为通用菜单组件
- 新增 `GET /openers` 拉取逻辑与状态管理
- 文案国际化：`openWith`, `openWithFinder`, `openWithDefault` 等

### CLI

- Control Server 新增 `GET /openers`、`POST /open`
- 新增 scheme 注册探测模块（按 OS 实现）
- 增加系统“Open With...”选择器的 best-effort 实现

### Shared

- 可选：为 opener 数据结构增加 schema（App/CLI 共用）

## 里程碑（建议）

1. 定义 opener schema 与 CLI 接口
2. CLI 实现 scheme 探测 + `open` 兜底执行
3. App 替换 UI 并接入 scheme/cli opener
4. 补充安全校验与灰度开关

## 风险与待确认事项

- URL Scheme 在浏览器侧的触发与弹窗策略不一致
- Windows/Linux “Open With...” 选择器对目录支持有限
- 是否需要允许打开非 cwd 的工程（如 monorepo 子目录）
- 安全模型（token + origin）在浏览器侧的最佳实践
