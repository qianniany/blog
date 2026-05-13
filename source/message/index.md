---
title: 留言板
date: 2026-05-13 00:10:00
layout: page
---

{% raw %}
<div class="message-page">
  <section class="message-hero">
    <div class="message-hero__badge">
      <i class="fas fa-satellite-dish"></i>
      <span>Interaction Channel</span>
    </div>
    <h1>在这里留下你的信号</h1>
    <p>
      想打个招呼、交流文章内容、反馈页面问题，或者只是路过留下一句今天的心情，都欢迎写在这里。
      留言会通过 GitHub Issues 保存，方便长期归档和持续回复。
    </p>
  </section>

  <section class="message-grid">
    <div class="message-card">
      <h2><i class="fas fa-comment-dots"></i> 可以聊些什么</h2>
      <ul class="message-list">
        <li>对某篇文章的想法、补充和勘误</li>
        <li>学习路线、项目实践和工具使用心得</li>
        <li>站点样式、功能体验或访问异常反馈</li>
        <li>随手留一句问候，记录一次相遇</li>
      </ul>
    </div>

    <div class="message-card">
      <h2><i class="fas fa-circle-info"></i> 留言说明</h2>
      <ul class="message-list">
        <li>首次留言会跳转 GitHub 授权，这是 GitHub 留言系统的正常流程</li>
        <li>留言公开展示，请不要填写手机号、住址等隐私信息</li>
        <li>如果组件加载较慢，通常是 GitHub 接口或网络原因，刷新即可</li>
        <li>建议使用常用 GitHub 账号，方便后续收到回复通知</li>
      </ul>
    </div>
  </section>

  <section class="message-note">
    <div class="message-note__icon">
      <i class="fab fa-github"></i>
    </div>
    <div>
      <h2>留言已接入 GitHub</h2>
      <p>
        当前留言区使用 GitHub Issues 驱动，适合做公开留言板、问题反馈和长期交流归档。
        你可以直接在下方发表评论，也可以在 GitHub 仓库中查看对应讨论线程。
      </p>
    </div>
  </section>

  <section class="message-comment">
    <div class="message-comment__headline">
      <i class="fas fa-comments"></i>
      <span>GitHub 留言区</span>
    </div>
    <div id="utterances-wrap"></div>
  </section>
</div>

<script>
  (() => {
    const wrap = document.getElementById('utterances-wrap');
    if (!wrap || wrap.dataset.loaded) return;

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('repo', 'qianniany/blog');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'comments');
    script.setAttribute('theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'photon-dark' : 'github-light');

    wrap.dataset.loaded = 'true';
    wrap.appendChild(script);
  })();
</script>
{% endraw %}
