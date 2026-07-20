hexo.extend.generator.register("cy-fun-posts", function (locals) {
  const root = this.config.root || "/";
  const normalizedRoot = root.endsWith("/") ? root : root + "/";
  const posts = locals.posts
    .sort("-date")
    .filter(function (post) {
      return post.published !== false && !post.link;
    })
    .map(function (post) {
      return {
        title: post.title || "未命名文章",
        path: normalizedRoot + String(post.path || "").replace(/^\/+/, "")
      };
    });

  return {
    path: "fun-posts.json",
    data: JSON.stringify({
      version: 1,
      generatedAt: new Date().toISOString(),
      posts: posts
    })
  };
});
