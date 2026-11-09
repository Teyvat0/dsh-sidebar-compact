# 侧边栏紧凑化 · DSH Sidebar Compact

给 [DeepSeek Harness](https://github.com/deepseek-ai) Web UI 的左侧边栏加**三个按钮**，把「面板列表 + 工作区」的纵向空间重新分配：收起/展开、紧凑模式、折叠图标格。

A client-side plugin for the DeepSeek Harness Web UI that makes the left sidebar collapse-friendly and denser, freeing vertical room for the workspace.

- **不修改宿主任何代码**，纯 Client bundle（Slot 注入 + 注入样式 + 一个很小的 DOM 宽度写回）
- **状态持久化**在 `localStorage`，刷新、重启后沿用
- **与宿主自带的收起入口天然同步**（`layout.toggleSidebar()`），不自己维护第二份状态
- 已验证环境：Windows 11 + DSH `0.2.2-rc.1`（`@deepseek-ai/dsh-client-ui-sidebar` / `dsh-client-ui-layout` 同为 `0.2.2-rc.1`）

---

## 目录

- [功能](#功能)
- [快速开始](#快速开始)
- [使用](#使用)
- [配置](#配置)
- [工作原理](#工作原理)
- [兼容性](#兼容性)
- [已知限制](#已知限制)
- [版本历史](#版本历史)
- [仓库结构](#仓库结构)
- [开发](#开发)
- [许可](#许可)

---

## 功能

| 按钮 | 位置 | 作用 | 默认 |
| --- | --- | --- | --- |
| **收起 / 展开** | 侧边栏底部、设置图标旁 | 调用宿主 `layout.toggleSidebar()`；收起后在 56px 窄轨的同一位置显示展开按钮 | — |
| **紧凑模式** | 同上 | 列宽 280 → 248px；面板行 36 → 32px，列表间距与新会话按钮一起收紧 | 开启 |
| **折叠面板列表** | 同上 | 把「插件 … 更多」10 行折成 6+4 两行图标格（每格 34px），纵向腾出约 300px | 开启 |
| **自绘提示气泡** | 悬停任意按钮 350ms | 两行说明（当前状态 + 点击效果），不依赖系统 `title`，不会被窗口边缘裁掉 | — |

折叠是**纯 CSS 布局变换**，不隐藏数据、不重排宿主组件：

```
紧凑模式开 ─┬─ 面板列表展开：图标 + 文字，行高 32px
            └─ 面板列表折叠：两行图标格（6 + 4）
紧凑模式关 ─┬─ 面板列表展开：图标 + 文字，行高 36px
            └─ 面板列表折叠：两行图标格（6 + 4，宽度恢复 280px）
```

两个开关互相独立：关掉紧凑模式后，折叠依然有效。

## 快速开始

### 环境要求

- 桌面版 DeepSeek Harness（Web UI），Client 侧包含 `@deepseek-ai/dsh-client-ui-sidebar`
- 插件以 **bundle** 形式安装，宿主负责加载 `client.js`

### 安装

把本仓库目录交给 DSH 安装（`plugin_manager` 接受一个绝对路径）：

```
plugin_manager(action: "install_bundle", target: "<本仓库的绝对路径>")
```

等价的手动步骤（任选其一）：

1. 在 DSH 的「插件」面板里选择从本地目录安装，指向本仓库；
2. 或让 DSH 智能体调用上面的 `plugin_manager` 工具。

安装后刷新页面（`Ctrl+R` / `⌘R`）即可看到底栏两个新图标。插件目录以**软链**方式装进 profile，之后改代码只需刷新，不必重新安装。

### 卸载

```
plugin_manager(action: "remove_bundle", target: "@local/dsh-sidebar-compact")
```

## 使用

底部工具条从左到右：**收起/展开**、**紧凑模式开关**、**折叠开关**。

| 操作 | 结果 |
| --- | --- |
| 点收起按钮 | 侧边栏收起为 56px 窄轨（Windows 标题栏模式下宽度归零，入口移到标题栏） |
| 点展开按钮 | 恢复到默认宽度 280px |
| 点紧凑开关 | 248px + 更紧的行距；再点恢复 |
| 点折叠开关 | 面板列表变图标格；再点恢复带文字的列表 |
| 折叠时悬停图标 | 自绘气泡显示该面板名字 |

已有入口（插件只是让它们更可发现）：

| 方式 | 说明 |
| --- | --- |
| `Ctrl+B` / `⌘B` | 宿主内置快捷键 `sidebar.left.toggle`，插件**不重复绑定** |
| 标题栏图标 | Windows 标题栏模式下收起后的入口 |
| 点击品牌标识 | 收起状态下点击可展开 |

状态存储：

| 键 | 值 | 默认 |
| --- | --- | --- |
| `dsh-sidebar-compact.mode` | `"on"` / `"off"` | `"on"` |
| `dsh-sidebar-compact.panels` | `"folded"` / `"open"` | `"folded"` |

页面根节点上会同步两个属性，便于调试或写额外样式：

```html
<html data-dsh-sidebar-compact="on" data-dsh-sidebar-panels="folded">
```

## 配置

改 `client.js` 里的常量，保存后刷新页面即可（插件是软链安装，无需第二次 install）：

| 常量 | 默认 | 说明 |
| --- | --- | --- |
| `COMPACT_WIDTH` | `248` | 紧凑模式列宽。宿主可拖拽区间是 264–420，248 是故意低于区间、换取更多工作区宽度的值 |
| `readStoredMode()` 的默认返回值 | `true` | 首次使用是否默认开启紧凑模式 |
| `readStoredFolded()` 的默认返回值 | `true` | 首次使用是否默认折叠面板列表 |
| CSS `min-height:32px` / `padding-top:5px` | — | 面板行密度 |
| CSS `34px` + `gap:4px` | — | 折叠图标格尺寸；248px 列内 `6×34 + 5×4 = 224` 正好一行 6 个 |
| CSS `padding-right:24px` | — | 「新会话」内容整体左移半个图标宽，让文字真正居中 |

## 工作原理

### 参与的两个 Slot

| Slot | 形态 | 用途 |
| --- | --- | --- |
| `sidebar.footer.action` | list | 底栏按钮，宿主传入 `wide: boolean`（`false` = 56px 窄轨） |
| `shell.overlay` | list | 自绘气泡的浮层，位于所有列之上、各列滚动容器之外，整层点击穿透 |

### 宽度：为什么分两半

宿主把侧栏宽度写成两个地方：

1. 网格容器的 inline `grid-template-columns`，形如 `280px minmax(0px, 1fr) minmax(0px, 420px)`；
2. 侧栏根节点自身的 inline `width`（`SidebarRoot` 接收的 `width` prop）。

只改前者，根节点仍按旧宽度渲染，会被 `.sidebarCol{overflow:hidden}` 从右边裁掉一截（1.0.0/1.0.1 的真实 bug）。因此：

- **网格轨道**用 JS 改写：`syncFrameWidth()` 只替换开头那段宽度数字，**右侧栏那两段原样保留**——右侧栏开着时也不会被挤掉；
- **根节点宽度**用 CSS `!important` 压回 248px；
- 收起态、抽屉态、拖拽中直接跳过；关闭紧凑模式时把记录下来的原始宽度还回去；
- `MutationObserver` 只监听 `_frame` 自身的 `style` / `data-sidebar-collapsed` / `data-sidebar-drawer` / `data-dragging`，`requestAnimationFrame` 去抖。

### 选择器为什么是后缀匹配

宿主样式来自 CSS Modules，类名形如 `mP3x-q_frame` / `wtg9ga_panelRow`，哈希每次构建都变。所以本插件只用 `[class*="_frame"]`、`[class*="_panelRow"]` 这类**后缀**匹配，并靠 DOM 结构（`_frame > _sidebarCol > _root`）收窄范围，避免误伤其它组件。

> 注意后缀匹配是**子串**匹配：`[class*="_newSession"]` 会同时命中 `_newSessionContent`、`_newSessionLabelMask`、`_newSessionLabel`。1.0.4 就因此把「新会话」文字顶到了按钮上方；1.0.5 起改用 `button[class*="_newSession"]` 限定到按钮本身。

### 折叠为什么是纯 CSS

面板列表是一个 `flex-direction: column` 的容器，改成 `row + wrap` 后每行变成 34px 方格、文字 span 隐藏，就得到图标格。折叠不改变 DOM，宿主的「更多」菜单是 portal 渲染，不受影响。

宿主在展开态把面板行的 `Tooltip` 设为 `disabled: wide`，折叠后图标自然没有自带提示，所以插件在 `document` 上做事件委托，悬停时用同一个 overlay 气泡显示按钮的 `aria-label`。

### 气泡为什么不复刻系统 `title`

1.0.0 用原生 `title` 时，气泡贴着指针向右下弹出，在窗口/侧栏边缘会被切掉，还会压住底栏品牌行。现在气泡注册在 `shell.overlay`，按「按钮矩形 + 浮层矩形」换算位置，横向 clamp 在浮层内（8px 边距），上方放不下时自动翻到下方；气泡自身 `pointer-events: none`。若 `shell.overlay` 注册失败，自动退回原生 `title`。

## 兼容性

| 项目 | 说明 |
| --- | --- |
| DSH Client | 在 `0.2.2-rc.1` 上验证；宿主升级后若 CSS Modules 局部名或 Slot 契约变化，插件可能失效（失效时通常只是样式不生效，不会报错） |
| 平台 | Windows（标题栏模式 / 普通模式）与 macOS 的桌面窗口；Web 版同样适用 |
| 右侧栏 | 兼容。紧凑宽度只改左侧第一轨，右侧栏开启时不受影响 |
| 抽屉模式 | 跳过紧凑宽度改写（抽屉使用 transform 定位，不参与网格轨道） |
| 其它侧栏插件 | 与 `dsh-better-sidebar`（右侧栏文件树/编辑器）共存验证过，二者互不干扰 |

## 已知限制

- 紧凑宽度会覆盖手动拖拽：拖拽过程中有实时反馈，松手后回到 248px。想要自由拖拽请先关闭紧凑模式（关闭时会把拖拽得到的宽度还给你）。
- 折叠后面板只剩图标，识别依赖悬停气泡；想直接看文字就先关掉折叠。
- 后缀选择器依赖宿主的 CSS Modules 局部名，宿主改名后规则会静默失效。
- Windows 标题栏模式下收起会隐藏整个底栏与面板区，此时用 `Ctrl+B` 或标题栏按钮展开。
- 未做逐像素视觉回归测试：验证方式是「bundle 安装 → `plugin_manager` 中 `fiberPhase: active` → 两个 Slot occupant 均在 → 页面人工确认」。

## 版本历史

| 版本 | 变更 |
| --- | --- |
| `1.0.5` | 修复「新会话」文字偏上：选择器限定为 `button[class*="_newSession"]`，不再波及内容/遮罩/文字三个内层 span |
| `1.0.4` | 宽度改为 JS 只改第一轨（右侧栏不再被挤）；折叠与紧凑模式解耦；「新会话」居中（`padding-right` 半图标宽） |
| `1.0.3` | 新增面板列表纵向折叠（图标格 + 悬停气泡） |
| `1.0.2` | 同时改写网格轨道与侧栏根节点宽度，修复右侧内容被裁切 |
| `1.0.1` | 自绘气泡（`shell.overlay`），替换会被裁掉的原生 `title` |
| `1.0.0` | 首次发布：底栏收起/展开按钮、紧凑模式、Ctrl+B 无需重复绑定 |

## 仓库结构

```
dsh-sidebar-compact/
├── client.js          # Client bundle：Slot 注册、样式注入、宽度改写、气泡
├── index.js           # Host 半：空实现（只负责让 bundle 被加载）
├── cordis.patch.yml   # bundle patch：把本包插入 Cordis 运行时
├── package.json       # exports + dsh.bundle.patch + dsh.client
├── locale/
│   ├── zh.json        # 插件元信息（中文）
│   └── en.json        # 插件元信息（英文）
├── icon.svg           # 插件图标（≤ 256 KiB）
├── README.md
└── LICENSE
```

## 开发

- `client.js` 是单文件 IIFE 风格的 Client bundle：`window.__ModuleLoader__.load({ id, factory(require) { … } })`，`factory` 返回 `{ inject, apply }`。
- `apply(ctx)` 里做三件事：注册 locale（`ctx.locale.register` + `bind`）、注入 `<style data-plugin="@local/dsh-sidebar-compact">`、向两个 Slot 注册组件；所有副作用都包在 `ctx.effect` 里以便卸载。
- 改完先做语法检查：

```bash
node --check client.js
```

- 之后刷新页面即可；插件以软链方式安装，不需要重新 `install_bundle`（改了 `package.json` 版本号也一样）。

## 许可

[MIT](LICENSE) © Teyvat0
