# Hexo 使用说明

## 1. 这是什么

这是一个基于 Hexo 的静态博客项目。

当前项目关键信息：

- Hexo 版本：`8.1.2`
- 主题：`butterfly`
- 站点标题：`qianny's Blog`
- 站点地址：`https://qianniany.github.io`
- 站点根路径：`/blog/`
- 项目目录：`D:\bolg\blog`

## 2. 常用目录说明

- `source/_posts`：博客文章放这里
- `source/about`：关于页
- `source/message`：留言页
- `source/img`：图片资源
- `source/css`：自定义样式
- `source/js`：自定义脚本
- `themes`：主题目录
- `public`：生成后的静态网站文件
- `_config.yml`：站点主配置
- `_config.butterfly.yml`：Butterfly 主题配置
- `scaffolds`：文章模板

## 3. 启动项目前先知道

这个项目已经安装过依赖，`node_modules` 目录已存在。

进入项目目录：

```powershell
cd D:\bolg\blog
```

## 4. 本地预览博客

启动本地服务：

```powershell
npm run server
```

默认会启动 Hexo 本地预览服务，常见访问地址通常是：

```text
http://localhost:4000/blog/
```

如果页面资源路径不对，优先检查 `_config.yml` 里的这两个配置：

```yml
url: https://qianniany.github.io
root: /blog/
```

因为你这个项目不是部署在域名根目录，而是部署在 `/blog/` 子路径下，所以 `root` 不能随便改。

## 5. 新建文章

新建一篇文章：

```powershell
npx hexo new "我的第一篇文章"
```

或者：

```powershell
hexo new "我的第一篇文章"
```

创建后，文章会出现在：

```text
source/_posts/我的第一篇文章.md
```

## 6. 文章基本格式

Hexo 文章顶部一般有 Front-matter，例如：

```markdown
---
title: 我的第一篇文章
date: 2026-05-13 10:00:00
tags:
  - Hexo
  - 博客
categories:
  - 学习记录
---

这里开始写正文。
```

常用字段说明：

- `title`：文章标题
- `date`：发布时间
- `tags`：标签
- `categories`：分类

## 7. 写文章时常用 Markdown

标题：

```markdown
# 一级标题
## 二级标题
### 三级标题
```

列表：

```markdown
- 条目 1
- 条目 2
```

代码块：

```markdown
```js
console.log('hello hexo')
```
```

图片：

```markdown
![图片说明](/img/example.png)
```

如果图片放在 `source/img` 下，生成后通常可以用 `/img/文件名` 访问。

## 8. 新建独立页面

新建关于页：

```powershell
npx hexo new page about
```

新建留言页：

```powershell
npx hexo new page message
```

你当前项目里已经存在：

- `source/about`
- `source/message`

所以这两个页面已经建好了。

## 9. 生成静态文件

生成网站文件：

```powershell
npm run build
```

对应命令实际是：

```powershell
hexo generate
```

生成后的文件会输出到：

```text
public
```

## 10. 清理缓存

当页面异常、配置没生效、资源路径混乱时，可以先清理再重新生成：

```powershell
npm run clean
npm run build
```

对应命令是：

```powershell
hexo clean
hexo generate
```

## 11. 部署博客

项目里有部署命令：

```powershell
npm run deploy
```

但当前 `_config.yml` 中的部署配置是空的：

```yml
deploy:
  type: ""
```

这表示你现在还没有真正配置 Hexo 的一键部署。

如果你是发布到 GitHub Pages，通常需要：

1. 安装部署插件
2. 在 `_config.yml` 中填写 `deploy` 配置
3. 执行 `hexo clean && hexo generate && hexo deploy`

常见示例配置如下：

```yml
deploy:
  type: git
  repo: https://github.com/你的用户名/仓库名.git
  branch: gh-pages
```

如果以后要正式启用部署，建议先确认你当前仓库的 GitHub Pages 发布方式，再补充配置。

## 12. 修改站点基础信息

主配置文件是：

`_config.yml`

你可以在这里修改：

- `title`：网站标题
- `subtitle`：副标题
- `description`：站点描述
- `author`：作者
- `language`：语言
- `url`：网站地址
- `root`：站点根路径
- `theme`：主题

当前主题配置文件是：

`_config.butterfly.yml`

这里主要控制：

- 导航菜单
- 首页大图
- 头像
- 侧边栏
- 社交链接
- 主题色

## 13. 你这个项目里已经能看到的主题配置

当前 Butterfly 主题已经配置了这些内容：

- 顶部导航菜单
- 首页、归档、标签、分类页顶部图片
- 头像和公告卡片
- 侧边栏最近文章、分类、标签、归档
- 主题主色

如果你想改页面风格，优先看：

- `_config.butterfly.yml`
- `source/css`
- `source/img`

## 14. 常见问题

### 1. 为什么本地能看，部署后样式丢失？

通常是 `url` 和 `root` 配置不对。

你当前项目应重点保持：

```yml
url: https://qianniany.github.io
root: /blog/
```

### 2. 为什么文章写了但首页没显示？

常见原因：

- 文章 Front-matter 格式写错
- 日期格式异常
- 没有重新生成
- 文章被放错目录，不在 `source/_posts`

### 3. 修改配置后为什么没变化？

先执行：

```powershell
npm run clean
npm run server
```

### 4. `public` 目录能不能手动改？

不建议。`public` 是自动生成目录，手动修改通常会在下次生成时被覆盖。应优先修改 `source`、主题配置或模板。

## 15. 最常用命令速查

```powershell
cd D:\bolg\blog
npm run server
npm run build
npm run clean
npm run deploy
npx hexo new "文章标题"
npx hexo new page about
```

## 16. 推荐日常使用流程

1. 进入项目目录
2. 执行 `npm run server`
3. 在 `source/_posts` 中写文章
4. 本地预览效果
5. 确认无误后执行 `npm run build`
6. 如果已经配置部署，再执行 `npm run deploy`

## 17. 一句话总结

你可以把 Hexo 理解成：

“在 `source` 里写内容，用 Hexo 生成到 `public`，再把 `public` 部署到网站上。”

