# TechNotes · 网络 / 运维 技术文档站

一个可以直接丢到 GitHub Pages 的纯静态文档站。零构建、零依赖、无框架，全部内容存在一个 `data/posts.js` 里。

- 首页：首屏 + 版块卡片 + 最新日志 + 全部日志（筛选 / 搜索 / 加载更多）
- 版块页：网络、运维，以及你后续自己加的任何版块
- 详情页：Markdown 渲染、右侧目录、代码块、图片灯箱、上下篇
- 写日志：本地编辑器（`local-tools/`，不上传线上），实时预览 + 一键发布（由本地 Python 服务完成落盘和 git 推送）
- 深色 / 浅色主题，跟随系统并可手动切换
- 响应式，手机上也能用

---

## 一、本地看效果

不需要装任何东西，直接双击 `index.html` 就行。

想更贴近线上环境（推荐），在项目根目录用自带的服务脚本：

```bash
python serve.py
# 站点预览：  http://127.0.0.1:8000/
# 本地编辑器：http://127.0.0.1:8000/local-tools/editor.html
```

serve.py 只监听 127.0.0.1（仅本机可访问），同时提供 `POST /publish` 一键发布接口。

---

## 二、部署到 GitHub Pages

1. 新建一个仓库，把本目录所有文件推上去（`index.html` 必须在仓库根目录）
2. 仓库 **Settings → Pages**
3. **Source** 选 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`，保存
4. 等 1 分钟左右，访问 `https://你的用户名.github.io/仓库名/`

> 如果仓库名就叫 `用户名.github.io`，访问地址是 `https://用户名.github.io/`。
> 站点里的所有链接都是相对路径，放在子目录下也能正常工作。

第一次 push 的命令（在项目根目录执行）：

```bash
git init
git add .
git commit -m "init: technotes site"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

---

## 三、加一篇图文日志

### 方式 A：用本地编辑器（不上传线上）

编辑器放在 `local-tools/`（被 `.gitignore` 忽略，不会出现在仓库和线上站点里）。
在仓库根目录运行 `python serve.py`，然后访问
`http://127.0.0.1:8000/local-tools/editor.html`：

1. 填标题、选版块、写正文
2. 图片：点工具栏「图片」按钮选本地文件，或直接把图片拖进输入框 —— 会自动转成内嵌 base64，立刻能在预览里看到
3. 右侧实时预览
4. 底部「一键发布」：由 serve.py 追加到 `data/posts.js` 并自动 git commit / push
5. 复制数据 / 下载 posts.js / 下载 .md 等手动通道全部保留，作为一键发布的退路

详细步骤、报错对照和安全说明见 `local-tools/使用说明.md`（仅本机）。

### 方式 B：手写数据

在 `data/posts.js` 的 `window.POSTS` 里加一个对象：

```js
{
  id: "my-new-post",            // 唯一，会出现在 URL 里，建议英文
  title: "标题",
  category: "network",          // 对应 CATEGORIES 里的 id
  date: "2026-11-03",
  pinned: false,                // true 会置顶
  cover: "assets/uploads/a.png",// 可留空
  tags: ["标签1", "标签2"],
  excerpt: "列表里显示的摘要，留空就显示空。",
  content: `## 小标题

正文支持 Markdown：**加粗**、\`行内代码\`、列表、表格、引用、图片。

~~~bash
echo "代码块用三个反引号或三个波浪号都可以"
~~~
`
}
```

> 用反引号写 `content` 时，代码块建议用 `~~~` 包裹，避免和字符串定界符打架。

### 正文支持的语法

| 语法 | 写法 |
| --- | --- |
| 标题 | `##` ~ `######`（`#` 会渲染成二级标题） |
| 加粗 / 斜体 / 删除线 | `**粗**` `*斜*` `~~删~~` |
| 行内代码 | 反引号包裹 |
| 代码块 | 三个反引号或三个波浪号，后面可跟语言名 |
| 列表 | `-` / `1.`，支持缩进嵌套 |
| 引用 | `>` |
| 表格 | `\| a \| b \|` + `\| --- \| --- \|` |
| 图片 | `![说明](路径或网址)` |
| 链接 | `[文字](https://...)` |
| 分割线 | `---` |

### 图片放哪

- 小图（< 500KB）：编辑器里直接插入，内嵌 base64，最省事
- 大图 / 截图较多：放到 `assets/uploads/`，正文用相对路径引用，仓库体积更可控

---

## 四、加一个新版块

版块不写死在页面里。改 `data/posts.js` 里的 `window.CATEGORIES`，加一项：

```js
{
  id: "cloud",              // 英文标识，会出现在 URL：category.html?cat=cloud
  name: "云原生",
  icon: "cloud",            // 可选：network / server / cloud / code / terminal / db / shield / folder
  color: "#8b5cf6",         // 该版块的强调色
  desc: "K8s、CI/CD、可观测性相关笔记。"
}
```

保存后，顶部导航、首页版块卡片、全部日志的筛选项会自动多出一项 —— 不用改任何 HTML。

编辑器里也能直接新建：版块下拉选「＋ 新建版块…」，填名称和颜色，生成的 `CATEGORIES` 会一起带出来。

---

## 五、常见改动

| 想改什么 | 改哪里 |
| --- | --- |
| 站点名 / 副标题 / 作者 | `data/posts.js` → `window.SITE` |
| 页脚出现 GitHub 链接 | `window.SITE.repo` 填 `owner/repo` |
| 首页首屏文案 | `window.SITE.description` |
| 主题色、圆角、字号 | `assets/css/main.css` 顶部 `:root` 变量 |
| 首页「最新日志」条数 | `index.html` 里 `all.slice(0, 4)` |
| 归档每页条数 | `index.html` 里 `state.limit = 8` |
| 备案号 | `window.SITE.icp` |

---

## 六、目录结构

```
.
├── index.html              首页
├── category.html           版块页（?cat=network）
├── post.html               日志详情（?id=xxx）
├── data/
│   └── posts.js            ★ 所有内容都在这里
├── assets/
│   ├── css/main.css        全站样式
│   ├── js/site.js          公共逻辑 + Markdown 渲染器
│   ├── img/                图标与示意配图
│   └── uploads/            你上传的图片
├── local-tools/            本地写作工具（git 忽略，不上传）
│   ├── editor.html         可视化编辑器
│   └── 使用说明.md
├── serve.py                本地服务：静态托管 + /publish 一键发布（git 忽略，不上传）
├── .nojekyll               告诉 GitHub Pages 不要走 Jekyll
└── README.md
```

---

## 七、说明

- 全站没有追踪脚本、没有第三方 CDN，断网也能正常打开（本地文件模式）。
- Markdown 渲染器是手写的小实现，覆盖日常写作需要的语法；需要更复杂的排版（脚注、数学公式）时再引库也不迟。
- 线上站点是纯阅读站：写作工具（`local-tools/`、`serve.py`）在 `.gitignore` 里，永不提交；顶栏「写日志」按钮只在 127.0.0.1 / localhost 下渲染。
