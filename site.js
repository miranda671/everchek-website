/* ============================================================
   EverChek – Shared JavaScript
   使用说明：
   - 修改 nav.html  → 所有页面 header 自动更新
   - 修改 footer.html → 所有页面 footer 自动更新
   - 编辑 blog-data.json → 首页/博客页自动展示
   ============================================================ */

(function () {
  'use strict';

  /* ===== 动态加载 NAV 和 FOOTER ===== */
  function loadFragment(url, targetId, position) {
    var target = document.getElementById(targetId);
    if (!target) return;
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + url);
        return res.text();
      })
      .then(function (html) {
        if (position === 'replace') {
          target.outerHTML = html;
        }
        // 加载完成后初始化交互
        initNav();
        initFAQ();
        initAnimations();
        initBlogTOC();
        initAppFeature();
      })
      .catch(function (err) {
        console.warn('Fragment load error:', err);
        initNav();
        initFAQ();
        initAnimations();
        initBlogTOC();
        initAppFeature();
      });
  }

  function getBasePath() {
    var path = window.location.pathname;
    var depth = (path.match(/\//g) || []).length - 1;
    var prefix = '';
    for (var i = 0; i < depth; i++) { prefix += '../'; }
    return prefix;
  }

  var base = getBasePath();
  loadFragment(base + 'nav.html', 'nav-placeholder', 'replace');
  loadFragment(base + 'footer.html', 'footer-placeholder', 'replace');

  /* ===== 手机端 NAV TOGGLE ===== */
  function initNav() {
    var toggle = document.getElementById('nav-toggle');
    var mobileNav = document.getElementById('nav-mobile');
    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      mobileNav.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

  /* ===== FAQ 手风琴 ===== */
  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(function (btn) {
      if (btn._faqBound) return;
      btn._faqBound = true;
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (el) {
          el.classList.remove('open');
          el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ===== 滚动淡入动画 ===== */
  function initAnimations() {
    if (!('IntersectionObserver' in window)) {
      ['fade-up', 'receive-card', 'require-card', 'process-step'].forEach(function (cls) {
        document.querySelectorAll('.' + cls).forEach(function (el) { el.classList.add('visible'); });
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    ['fade-up', 'receive-card', 'require-card', 'process-step'].forEach(function (cls) {
      document.querySelectorAll('.' + cls).forEach(function (el) { observer.observe(el); });
    });
  }

  /* ===== 博客详情页目录生成 + 滚动高亮 ===== */
  function initBlogTOC() {
    // 只在有 #article-toc 的页面执行（博客详情页）
    var tocContainer = document.getElementById('article-toc');
    if (!tocContainer) return;

    var body = document.getElementById('article-body');
    if (!body) return;

    // 如果已经有目录项了就不再重复生成
    if (tocContainer.querySelectorAll('li').length > 0) return;

    // 从 h2 生成目录
    var headings = body.querySelectorAll('h2');
    var tocHTML = '';
    headings.forEach(function (h2) {
      var id = h2.getAttribute('id');
      if (!id) {
        id = h2.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-\$/g, '');
        h2.setAttribute('id', id);
      }
      // 第一个 h2 特殊 class，不加顶部间距
      if (h2 === headings[0]) h2.classList.add('first-h2');
      tocHTML += '<li><a href="#' + id + '">' + h2.textContent + '</a></li>';
    });
    tocContainer.innerHTML = tocHTML;

    // 滚动高亮
    if (!('IntersectionObserver' in window)) {
      tocContainer.querySelectorAll('a').forEach(function (a) { a.classList.add('active'); });
      return;
    }

    var tocLinks = tocContainer.querySelectorAll('a');
    var tocObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tocLinks.forEach(function (l) { l.classList.remove('active'); });
          var activeLink = tocContainer.querySelector('a[href="#' + entry.target.id + '"]');
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, { rootMargin: '-10% 0px -75% 0px', threshold: 0 });

    headings.forEach(function (h2) {
      tocObserver.observe(h2);
    });
  }

  /* ===== App 功能区滑入动画 ===== */
  function initAppFeature() {
    var els = document.querySelectorAll('.app-feature-inner');
    if (!els.length || !('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('slide-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFAQ();
    initAnimations();
    initBlogTOC();
    initAppFeature();
  });

})();


/* ===== BLOG POST RENDERER ===== */
/* Add entries to blog-data.json → auto-appears on homepage + blog page */
(function () {
  'use strict';

  function renderBlogPosts() {
    var container = document.getElementById('home-blog-posts') || document.getElementById('blog-posts-container');
    if (!container) return;

    fetch('blog-data.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load blog data');
        return res.json();
      })
      .then(function (posts) {
        if (!posts || !posts.length) {
          container.innerHTML = '<p style="text-align:center;color:var(--brand-gray);grid-column:1/-1;padding:20px 0">No posts yet.</p>';
          return;
        }

        var isHome = !!document.getElementById('home-blog-posts');
        var displayPosts = isHome ? posts.slice(0, 3) : posts;

        var html = '';
        displayPosts.forEach(function (post) {
          html += ''
            + '<a href="' + esc(post.url || '#') + '" class="blog-card">'
            + '<div class="blog-card-img">'
            + '<img src="' + esc(post.image) + '" alt="' + esc(post.alt) + '">'
            + '</div>'
            + '<div class="blog-card-body">'
            + '<h3>' + esc(post.title) + '</h3>'
            + '<div class="blog-card-meta">'
            + '<span>' + esc(post.author) + '</span>'
            + '<span class="dot"></span>'
            + '<span>' + esc(post.date) + '</span>'
            + '</div>'
            + '</div>'
            + '</a>';
        });

        if (isHome && posts.length > 3) {
          html += ''
            + '<div style="grid-column:1/-1;text-align:center;margin-top:20px">'
            + '  <a href="cgm-blogs.html" class="link-arrow">View all posts <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>'
            + '</div>';
        }

        container.innerHTML = html;
      })
      .catch(function () {
        var el = document.getElementById('home-blog-posts') || document.getElementById('blog-posts-container');
        if (el) el.innerHTML = '<p style="text-align:center;color:var(--brand-gray);grid-column:1/-1;padding:20px 0">Unable to load posts.</p>';
      });
  }

  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBlogPosts);
  } else {
    renderBlogPosts();
  }
})();


