(() => {
  const X_WIDGETS_URL = "https://platform.twitter.com/widgets.js";

  const safeExternalUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  };

  const safeAssetUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value, document.baseURI);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  };

  const loadXEmbeds = (root = document) => {
    if (!root.querySelector(".article-x-embed .twitter-tweet")) return;
    if (root !== document && !root.isConnected) {
      requestAnimationFrame(() => {
        if (root.isConnected) loadXEmbeds(root);
      });
      return;
    }
    const renderEmbeds = () => window.twttr?.widgets?.load(root);
    const existingScript = document.querySelector(`script[src="${X_WIDGETS_URL}"]`);

    if (window.twttr?.widgets) {
      renderEmbeds();
      return;
    }
    if (existingScript) {
      existingScript.addEventListener("load", renderEmbeds, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = X_WIDGETS_URL;
    script.charset = "utf-8";
    script.addEventListener("load", renderEmbeds, { once: true });
    document.body.append(script);
  };

  const renderArticleMedia = (block) => {
    if (!block || typeof block !== "object") return null;

    if (block.type === "heading" && typeof block.text === "string") {
      const heading = document.createElement("h2");
      heading.className = "section-title article-body__heading";
      heading.textContent = block.text;
      return heading;
    }

    if ((block.type === "paragraph" || block.type === "note") && typeof block.text === "string") {
      const paragraph = document.createElement("p");
      paragraph.className = block.type === "note" ? "article-note" : "article-copy";
      paragraph.textContent = block.text;
      return paragraph;
    }

    if (block.type === "image" || block.type === "gif") {
      const src = safeAssetUrl(block.src);
      if (!src) return null;
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      figure.className = "media-block";
      image.src = src;
      image.alt = typeof block.alt === "string" ? block.alt : "";
      image.loading = "lazy";
      image.decoding = "async";
      if (Number.isFinite(block.width)) image.width = block.width;
      if (Number.isFinite(block.height)) image.height = block.height;
      figure.append(image);
      if (typeof block.caption === "string" && block.caption.trim()) {
        const caption = document.createElement("figcaption");
        caption.textContent = block.caption;
        figure.append(caption);
      }
      return figure;
    }

    if (block.type === "video") {
      const embedUrl = safeExternalUrl(block.embedUrl);
      if (!embedUrl) return null;
      const figure = document.createElement("figure");
      const wrapper = document.createElement("div");
      const iframe = document.createElement("iframe");
      figure.className = "media-block media-block--embed";
      wrapper.className = "media-embed";
      iframe.src = embedUrl;
      iframe.title = typeof block.title === "string" && block.title.trim()
        ? block.title.trim()
        : "記事内動画";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      wrapper.append(iframe);
      figure.append(wrapper);
      if (typeof block.caption === "string" && block.caption.trim()) {
        const caption = document.createElement("figcaption");
        caption.textContent = block.caption;
        figure.append(caption);
      }
      return figure;
    }

    if (block.type === "linkCard") {
      const href = safeExternalUrl(block.href);
      if (!href || typeof block.title !== "string") return null;
      const link = document.createElement("a");
      const title = document.createElement("strong");
      link.className = "article-link-card";
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      title.className = "article-link-card__title";
      title.textContent = block.title;
      link.append(title);
      if (typeof block.description === "string" && block.description.trim()) {
        const description = document.createElement("span");
        description.className = "article-link-card__description";
        description.textContent = block.description;
        link.append(description);
      }
      if (typeof block.source === "string" && block.source.trim()) {
        const source = document.createElement("span");
        source.className = "article-link-card__source";
        source.textContent = block.source;
        link.append(source);
      }
      return link;
    }

    if (block.type === "xEmbed") {
      const href = safeExternalUrl(block.href);
      if (!href || !/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i.test(href)) return null;
      const wrapper = document.createElement("div");
      const quote = document.createElement("blockquote");
      const fallback = document.createElement("a");
      wrapper.className = "article-x-embed";
      quote.className = "twitter-tweet";
      quote.dataset.mediaMaxWidth = "560";
      quote.dataset.dnt = "true";
      fallback.className = "article-x-embed__fallback";
      fallback.href = href;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      fallback.textContent = typeof block.fallbackText === "string" && block.fallbackText.trim()
        ? block.fallbackText.trim()
        : "Xの公式投稿を見る";
      quote.append(fallback);
      wrapper.append(quote);
      return wrapper;
    }

    return null;
  };

  const getOrderedBlocks = (article) => {
    const content = (article.contentBlocks || []).filter(
      (block) => !(
        block?.type === "source"
        || (block?.type === "text" && block?.role === "source")
      )
    );
    if (content.some((block) => block?.type === "reactions")) {
      return content;
    }
    const before = content.filter((block) => block?.placement === "beforeReactions");
    const after = content.filter((block) => block?.placement === "afterReactions");
    const unplaced = content.filter((block) => !block?.placement);
    return [...unplaced, ...before, { type: "reactions" }, ...after];
  };

  const renderReaction = (reaction, { includeId = true } = {}) => {
    const item = document.createElement("article");
    const label = document.createElement("span");
    const translation = document.createElement("p");
    item.className = "reaction";
    if (includeId && Number.isInteger(reaction.number)) {
      item.id = `reaction-${reaction.number}`;
    }
    label.className = "reaction__meta";
    label.textContent = reaction.name;
    translation.className = "reaction__translation";
    translation.textContent = reaction.text;
    item.append(label, translation);
    return item;
  };

  const renderReactions = (
    article,
    { container, start = 0, limit = Infinity, includeIds = true }
  ) => {
    const selected = (article.reactions || []).slice(start, start + limit);
    const nodes = selected.map(
      (reaction) => renderReaction(reaction, { includeId: includeIds })
    );
    container.replaceChildren(...nodes);
    return nodes;
  };

  const renderArticleBody = (
    article,
    {
      container,
      maxReactions = Infinity,
      includeReactionIds = true,
      reactionsHeading = "海外の反応"
    }
  ) => {
    const nodes = [];
    let renderedReactionCount = 0;
    let reactionCursor = 1;
    let reactionHeadingRendered = false;
    let stopped = false;

    for (const block of getOrderedBlocks(article)) {
      if (block?.type !== "reactions") {
        const node = renderArticleMedia(block);
        if (node) nodes.push(node);
        continue;
      }

      if (!reactionHeadingRendered && reactionsHeading) {
        const heading = document.createElement("h2");
        heading.className = "section-title article-body__heading";
        heading.textContent = reactionsHeading;
        nodes.push(heading);
        reactionHeadingRendered = true;
      }

      const start = Number.isInteger(block.start) ? block.start : reactionCursor;
      const end = Number.isInteger(block.end) ? block.end : Infinity;
      const available = (article.reactions || []).filter(
        (reaction) => reaction.number >= start && reaction.number <= end
      );
      const remaining = Math.max(0, maxReactions - renderedReactionCount);
      const selected = available.slice(0, remaining);

      if (selected.length) {
        const group = document.createElement("div");
        group.className = "reactions";
        group.setAttribute("aria-label", "海外の反応");
        group.append(...selected.map(
          (reaction) => renderReaction(reaction, { includeId: includeReactionIds })
        ));
        nodes.push(group);
        renderedReactionCount += selected.length;
        reactionCursor = selected[selected.length - 1].number + 1;
      } else if (Number.isFinite(end)) {
        reactionCursor = end + 1;
      }

      if (renderedReactionCount >= maxReactions) {
        stopped = true;
        break;
      }
    }

    container.replaceChildren(...nodes);
    container.hidden = nodes.length === 0;
    loadXEmbeds(container);
    return Object.freeze({ nodes, renderedReactionCount, stopped });
  };

  const getSources = (article) => (article.contentBlocks || []).filter(
    (block) => (
      block?.type === "source"
      || (block?.type === "text" && block?.role === "source")
    ) && typeof block.text === "string" && block.text.trim()
  );

  const renderSources = (article, { block, list }) => {
    const sources = getSources(article);
    block.hidden = sources.length === 0;
    list.replaceChildren(...sources.map((source) => {
      const item = document.createElement("span");
      const href = safeExternalUrl(source.href);
      item.className = "source-list__item";
      if (href) {
        const link = document.createElement("a");
        link.textContent = source.text.trim();
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        item.append(link);
      } else {
        item.textContent = source.text.trim();
      }
      return item;
    }));
    return sources;
  };

  const renderRelatedArticles = (items, { container, hrefForArticle }) => {
    const nodes = items.map((item) => {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      listItem.dataset.articleId = item.articleId;
      link.href = hrefForArticle(item);
      link.textContent = item.title;
      listItem.append(link);
      return listItem;
    });
    container.replaceChildren(...nodes);
    return nodes;
  };

  const renderArticle = (
    article,
    { body, sources, related }
  ) => {
    if (body) renderArticleBody(article, body);
    if (sources) renderSources(article, sources);
    if (related) renderRelatedArticles(related.items, related);
  };

  window.FootVoxArticleRenderer = Object.freeze({
    getSources,
    loadXEmbeds,
    renderArticle,
    renderArticleBody,
    renderArticleMedia,
    renderReaction,
    renderReactions,
    renderRelatedArticles,
    renderSources,
    safeAssetUrl,
    safeExternalUrl
  });
})();
