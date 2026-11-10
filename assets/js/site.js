/* ==========================================================================
   site.js · 全站公共逻辑
   - 主题切换（localStorage 记忆）
   - 顶栏 / 页脚自动注入
   - 轻量 Markdown 渲染器（无第三方依赖）
   - 目录、灯箱、工具函数
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------- 基础工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function fmtDate(d) {
    if (!d) return "";
    var s = String(d).slice(0, 10);
    var p = s.split("-");
    if (p.length < 3) return s;
    return p[0] + "-" + p[1] + "-" + p[2];
  }

  function monthDay(d) {
    var s = String(d || "").slice(0, 10).split("-");
    return s.length >= 3 ? s[1] + "-" + s[2] : String(d || "");
  }

  function yearOf(d) {
    return String(d || "").slice(0, 4);
  }

  function readingTime(text) {
    var t = String(text || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/~~~[\s\S]*?~~~/g, "")
      .replace(/[#>*`\-|]/g, "");
    var cn = (t.match(/[\u4e00-\u9fa5]/g) || []).length;
    var en = (t.match(/[a-zA-Z]+/g) || []).length;
    var min = Math.max(1, Math.round(cn / 380 + en / 220));
    return min;
  }

  function slug(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "section";
  }

  function hexToRgba(hex, a) {
    var h = String(hex || "#3b82f6").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return "rgba(59,130,246," + a + ")";
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  /* ---------------- 图标 ---------------- */
  var S = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">';
  var ICONS = {
    network: S + '<rect x="9" y="2.5" width="6" height="5" rx="1.4"/><rect x="2.5" y="16" width="6" height="5" rx="1.4"/><rect x="15.5" y="16" width="6" height="5" rx="1.4"/><path d="M12 7.5v4M5.5 16v-2.5h13V16"/></svg>',
    server: S + '<rect x="3" y="4" width="18" height="6.5" rx="2"/><rect x="3" y="13.5" width="18" height="6.5" rx="2"/><path d="M6.5 7.2h.01M6.5 16.7h.01"/></svg>',
    cloud: S + '<path d="M17.5 19a4 4 0 0 0 .4-7.98A6 6 0 0 0 6.1 10.2A3.9 3.9 0 0 0 6.5 19z"/></svg>',
    code: S + '<path d="M9 18l-6-6 6-6M15 6l6 6-6 6"/></svg>',
    terminal: S + '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M6.5 9.5l3 2.5-3 2.5M12.5 15h4"/></svg>',
    db: S + '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.66 3.58 3 8 3s8-1.34 8-3v-13"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>',
    shield: S + '<path d="M12 2.5l7.5 3v6c0 4.6-3.1 8.3-7.5 10-4.4-1.7-7.5-5.4-7.5-10v-6z"/></svg>',
    plus: S + '<path d="M12 5v14M5 12h14"/></svg>',
    sun: S + '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    moon: S + '<path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.6 6.6 0 0 0 10.8 10.8z"/></svg>',
    search: S + '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>',
    pencil: S + '<path d="M12 20h9"/><path d="M16.6 3.4a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    arrowLeft: S + '<path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    arrowRight: S + '<path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    chevron: S + '<path d="M9 6l6 6-6 6"/></svg>',
    clock: S + '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    tag: S + '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.6" cy="7.6" r="1.2"/></svg>',
    image: S + '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5-6 6"/></svg>',
    copy: S + '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H5.5A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15"/></svg>',
    download: S + '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/></svg>',
    check: S + '<path d="M20 6L9 17l-5-5"/></svg>',
    trash: S + '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/></svg>',
    github: '<svg class="i" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.36 1.08 2.93.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
    close: S + '<path d="M18 6L6 18M6 6l12 12"/></svg>',
    folder: S + '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2.5h8.3A2.5 2.5 0 0 1 21.5 10v7A2.5 2.5 0 0 1 19 19.5H5.5A2.5 2.5 0 0 1 3 17z"/></svg>'
  };
  function icon(name) { return ICONS[name] || ICONS.code; }

  /* ---------------- 数据 ---------------- */
  var SITE = window.SITE || { title: "TechNotes", subtitle: "Notes", author: "" };
  var CATS = (window.CATEGORIES || []).slice();
  var POSTS = (window.POSTS || []).slice();

  function catById(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return { id: id || "other", name: "未分类", color: "#64748b", icon: "folder", desc: "" };
  }

  function sortedPosts() {
    return POSTS.slice().sort(function (a, b) {
      var pa = a.pinned ? 1 : 0, pb = b.pinned ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  function postsOf(catId) {
    return sortedPosts().filter(function (p) { return p.category === catId; });
  }

  function postUrl(p) { return "post.html?id=" + encodeURIComponent(p.id); }
  function catUrl(id) { return "category.html?cat=" + encodeURIComponent(id); }

  /* 编辑器是本地工具（local-tools/，不入库），只在 127.0.0.1 / localhost 下显示写作入口 */
  var IS_LOCAL = location.protocol !== "file:" &&
    /^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname);
  var EDITOR_HREF = "";
  if (IS_LOCAL) {
    EDITOR_HREF = location.pathname.indexOf("/local-tools/") !== -1
      ? "editor.html"
      : "local-tools/editor.html";
  }

  /* ---------------- Markdown 渲染 ---------------- */
  function inline(text) {
    var t = esc(text);
    var store = [];
    function keep(html) {
      store.push(html);
      return "\u0001" + (store.length - 1) + "\u0001";
    }

    t = t.replace(/`([^`\n]+)`/g, function (m, c) {
      return keep("<code>" + c + "</code>");
    });

    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, src) {
      src = src.replace(/&amp;/g, "&");
      return keep('<img src="' + src + '" alt="' + alt + '" loading="lazy">');
    });

    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, txt, href) {
      href = href.replace(/&amp;/g, "&");
      var ext = /^(https?:)?\/\//.test(href);
      return keep('<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + txt + "</a>");
    });

    t = t.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, "$1<em>$2</em>");
    t = t.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

    t = t.replace(/\u0001(\d+)\u0001/g, function (m, i) { return store[+i]; });
    return t;
  }

  function isTableSep(line) {
    return /^\s*\|?[\s:|-]*-[\s:|-]*\|[\s:|-]*$/.test(line || "");
  }

  function splitRow(row) {
    return row.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(function (c) { return c.trim(); });
  }

  var FENCE_RE = /^([ \t]*)(`{3,}|~{3,})[ \t]*([^\n]*)\n([\s\S]*?)^[ \t]*\2[ \t]*$/gm;

  function renderMarkdown(src) {
    if (!src) return "";
    var text = String(src).replace(/\r\n/g, "\n");
    var codes = [];

    text = text.replace(FENCE_RE, function (m, indent, fence, info, code) {
      codes.push({ info: info.trim(), code: code.replace(/\n$/, "") });
      return "\n\u0000C" + (codes.length - 1) + "\u0000\n";
    });

    var lines = text.split("\n");
    var out = [];
    var i = 0;

    function readList(start, ordered) {
      var re = ordered ? /^(\s*)\d+[.)]\s+(.*)$/ : /^(\s*)[-*+]\s+(.*)$/;
      var isItem = ordered
        ? function (l) { return /^\s*\d+[.)]\s+/.test(l); }
        : function (l) { return /^\s*[-*+]\s+/.test(l); };
      var html = ordered ? "<ol>" : "<ul>";
      var k = start;

      while (k < lines.length) {
        var line = lines[k];
        if (!line.trim()) {
          var nx = k + 1;
          while (nx < lines.length && !lines[nx].trim()) nx++;
          if (nx < lines.length && isItem(lines[nx])) { k = nx; continue; }
          break;
        }
        var mm = line.match(re);
        if (!mm) break;
        var indent = mm[1].length;
        var content = mm[2];
        k++;

        var sub = "";
        if (k < lines.length && isItem(lines[k])) {
          var nextIndent = lines[k].match(/^(\s*)/)[1].length;
          if (nextIndent > indent) {
            var r = readList(k, /^\s*\d+[.)]\s+/.test(lines[k]));
            sub = r[0];
            k = r[1];
          }
        }
        html += "<li>" + inline(content) + sub + "</li>";
      }
      html += ordered ? "</ol>" : "</ul>";
      return [html, k];
    }

    while (i < lines.length) {
      var rawLine = lines[i];
      var t = rawLine.replace(/\s+$/, "");
      var tt = t.trim();

      if (!tt) { i++; continue; }

      var cm = tt.match(/^\u0000C(\d+)\u0000$/);
      if (cm) {
        var c = codes[+cm[1]];
        var lang = (c.info.split(/\s+/)[0] || "").toLowerCase();
        out.push(
          '<figure class="code-block">' +
          (lang ? "<figcaption>" + esc(lang) + "</figcaption>" : "") +
          "<pre><code>" + esc(c.code) + "</code></pre></figure>"
        );
        i++;
        continue;
      }

      if (/^([-*_])\1{2,}$/.test(tt)) { out.push("<hr>"); i++; continue; }

      var hm = tt.match(/^(#{1,6})\s+(.*)$/);
      if (hm) {
        var lv = Math.min(6, hm[1].length + 1);
        var hid = "h-" + slug(hm[2].replace(/[*`]/g, "")) + "-" + i;
        out.push("<h" + lv + ' id="' + hid + '">' + inline(hm[2]) + "</h" + lv + ">");
        i++;
        continue;
      }

      if (/^>\s?/.test(tt)) {
        var buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          buf.push(lines[i].trim().replace(/^>\s?/, ""));
          i++;
        }
        out.push("<blockquote>" + renderMarkdown(buf.join("\n")) + "</blockquote>");
        continue;
      }

      if (tt.indexOf("|") > -1 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        var head = splitRow(tt);
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].trim() && lines[i].indexOf("|") > -1 && !/^\u0000C/.test(lines[i].trim())) {
          rows.push(splitRow(lines[i].trim()));
          i++;
        }
        var thtml = '<div class="table-wrap"><table><thead><tr>';
        head.forEach(function (h) { thtml += "<th>" + inline(h) + "</th>"; });
        thtml += "</tr></thead><tbody>";
        rows.forEach(function (r) {
          thtml += "<tr>";
          head.forEach(function (_, k2) { thtml += "<td>" + inline(r[k2] || "") + "</td>"; });
          thtml += "</tr>";
        });
        thtml += "</tbody></table></div>";
        out.push(thtml);
        continue;
      }

      if (/^[-*+]\s+/.test(tt) || /^\d+[.)]\s+/.test(tt)) {
        var lr = readList(i, /^\d+[.)]\s+/.test(tt));
        out.push(lr[0]);
        i = lr[1];
        continue;
      }

      var pb = [];
      while (i < lines.length) {
        var l = lines[i];
        var lt = l.trim();
        if (!lt) break;
        if (/^\u0000C\d+\u0000$/.test(lt)) break;
        if (/^#{1,6}\s/.test(lt)) break;
        if (/^>\s?/.test(lt)) break;
        if (/^[-*+]\s+/.test(lt) || /^\d+[.)]\s+/.test(lt)) break;
        if (/^([-*_])\1{2,}$/.test(lt)) break;
        if (lt.indexOf("|") > -1 && i + 1 < lines.length && isTableSep(lines[i + 1])) break;
        pb.push(lt);
        i++;
      }
      if (pb.length) out.push("<p>" + inline(pb.join("\n")).replace(/\n/g, "<br>") + "</p>");
      else { i++; }
    }

    return out.join("\n");
  }

  /* ---------------- 主题 ---------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("notes-theme", t); } catch (e) {}
    $$("[data-theme-toggle]").forEach(function (b) {
      b.innerHTML = t === "dark" ? icon("sun") : icon("moon");
      b.setAttribute("title", t === "dark" ? "切换到浅色" : "切换到深色");
    });
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  function initTheme() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-theme-toggle]") : null;
      if (t) applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
    applyTheme(currentTheme());
  }

  /* ---------------- 顶栏 / 页脚 ---------------- */
  function isActive(href, page, cat) {
    if (href.indexOf("category.html") === 0) {
      return page === "category.html" && href.indexOf("cat=" + cat) > -1;
    }
    return page === href;
  }

  function renderHeader() {
    var host = document.getElementById("site-header");
    if (!host) return;
    var page = (location.pathname.split("/").pop() || "index.html");
    if (page === "") page = "index.html";
    var cat = new URLSearchParams(location.search).get("cat") || "";

    var links = [{ href: "index.html", label: "首页" }];
    CATS.forEach(function (c) { links.push({ href: catUrl(c.id), label: c.name }); });
    links.push({ href: "index.html#archive", label: "全部日志", cls: "hide-sm" });

    var nav = links.map(function (l) {
      var cls = (isActive(l.href, page, cat) ? "active" : "") + " " + (l.cls || "");
      return '<a class="' + cls.trim() + '" href="' + l.href + '">' + esc(l.label) + "</a>";
    }).join("");

    host.className = "site-header";
    host.innerHTML =
      '<div class="wrap header-inner">' +
      '<a class="brand" href="index.html">' +
      '<span class="mark">&lt;/&gt;</span>' +
      "<span><span class=\"bname\">" + esc(SITE.title || "TechNotes") + "</span>" +
      '<small class="bsub">' + esc(SITE.subtitle || "Notes") + "</small></span>" +
      "</a>" +
      '<nav class="nav">' + nav + "</nav>" +
      '<button class="icon-btn" data-theme-toggle aria-label="切换主题" title="切换主题">' + icon("moon") + "</button>" +
      (IS_LOCAL ? '<a class="btn btn-primary btn-sm nav-cta" href="' + EDITOR_HREF + '">' + icon("pencil") + "<span>写日志</span></a>" : "") +
      "</div>";
  }

  function renderFooter() {
    var host = document.getElementById("site-footer");
    if (!host) return;
    var y = new Date().getFullYear();
    var from = SITE.startYear && SITE.startYear !== y ? SITE.startYear + "–" + y : y;
    var right = [];
    if (SITE.repo) {
      right.push('<a href="https://github.com/' + esc(SITE.repo) + '" target="_blank" rel="noopener">GitHub</a>');
    }
    if (IS_LOCAL) right.push('<a href="' + EDITOR_HREF + '">写日志</a>');
    right.push("<span>共 " + POSTS.length + " 篇</span>");

    host.innerHTML =
      '<footer class="site-footer"><div class="wrap footer-inner">' +
      "<div>© " + from + " " + esc(SITE.author || SITE.title || "") +
      " · 用纯静态页面记录" + (SITE.icp ? " · " + esc(SITE.icp) : "") + "</div>" +
      '<div class="footer-links">' + right.join("") + "</div>" +
      "</div></footer>";
  }

  /* ---------------- 目录 / 灯箱 ---------------- */
  function buildTOC(root, mount) {
    if (!mount) return;
    var hs = $$("h2, h3", root);
    if (hs.length < 2) { mount.innerHTML = ""; mount.style.display = "none"; return; }
    var html = "<h4>目录</h4>";
    hs.forEach(function (h) {
      html += '<a class="' + (h.tagName === "H3" ? "lv3" : "lv2") + '" href="#' + h.id + '">' + esc(h.textContent) + "</a>";
    });
    mount.innerHTML = html;

    var links = $$("a", mount);
    function onScroll() {
      var pos = window.scrollY + 120;
      var active = 0;
      hs.forEach(function (h, idx) { if (h.offsetTop <= pos) active = idx; });
      links.forEach(function (a, idx) { a.classList.toggle("active", idx === active); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initLightbox() {
    var box = document.getElementById("lightbox");
    if (!box) return;
    document.addEventListener("click", function (e) {
      var img = e.target.closest ? e.target.closest(".prose img") : null;
      if (img) {
        box.innerHTML = '<img src="' + img.getAttribute("src") + '" alt="">';
        box.classList.add("on");
      } else if (box.classList.contains("on")) {
        box.classList.remove("on");
        box.innerHTML = "";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("on")) {
        box.classList.remove("on");
        box.innerHTML = "";
      }
    });
  }

  /* ---------------- 组件片段 ---------------- */
  function catBadge(catId) {
    var c = catById(catId);
    return '<span class="badge" style="--c:' + c.color + ";--cbg:" + hexToRgba(c.color, 0.13) + '">' +
      '<span class="dot"></span>' + esc(c.name) + "</span>";
  }

  function tagList(tags) {
    if (!tags || !tags.length) return "";
    return tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
  }

  function postRow(p) {
    var c = catById(p.category);
    return '<a class="post-row" href="' + postUrl(p) + '">' +
      '<div class="post-date"><b>' + esc(monthDay(p.date)) + "</b>" + esc(yearOf(p.date)) + "</div>" +
      '<div class="post-row-main">' +
      '<div class="post-row-title"><h3>' + esc(p.title) + "</h3>" +
      (p.pinned ? '<span class="pin">置顶</span>' : "") +
      catBadge(p.category) + "</div>" +
      '<p class="post-row-desc">' + esc(p.excerpt || "") + "</p>" +
      (p.tags && p.tags.length ? '<div class="post-row-tags">' + tagList(p.tags) + "</div>" : "") +
      "</div>" +
      '<span class="post-row-go">' + icon("arrowRight") + "</span>" +
      "</a>";
  }

  function postCard(p) {
    var c = catById(p.category);
    var cover = p.cover
      ? '<div class="post-card-cover"><img src="' + esc(p.cover) + '" alt="" loading="lazy"></div>'
      : '<div class="post-card-cover" style="--c:' + c.color + '">' + icon(c.icon) + "</div>";
    return '<a class="post-card" href="' + postUrl(p) + '">' +
      cover +
      '<div class="post-card-body">' +
      '<div class="meta"><span>' + esc(fmtDate(p.date)) + "</span><span>·</span><span>" + esc(c.name) + "</span></div>" +
      "<h3>" + esc(p.title) + "</h3>" +
      "<p>" + esc(p.excerpt || "") + "</p>" +
      (p.tags && p.tags.length ? '<div class="tags">' + tagList(p.tags) + "</div>" : "") +
      "</div></a>";
  }

  /* ---------------- 对外接口 ---------------- */
  window.App = {
    $: $, $$: $$, esc: esc, icon: icon, slug: slug,
    fmtDate: fmtDate, monthDay: monthDay, yearOf: yearOf, readingTime: readingTime,
    hexToRgba: hexToRgba,
    SITE: SITE, CATS: CATS, POSTS: POSTS,
    catById: catById, sortedPosts: sortedPosts, postsOf: postsOf,
    postUrl: postUrl, catUrl: catUrl,
    isLocal: IS_LOCAL, editorHref: EDITOR_HREF,
    md: renderMarkdown,
    buildTOC: buildTOC,
    catBadge: catBadge, tagList: tagList, postRow: postRow, postCard: postCard
  };

  /* ---------------- 启动 ---------------- */
  function boot() {
    renderHeader();
    renderFooter();
    initTheme();
    initLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
