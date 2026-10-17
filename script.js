// WordPress.com sites expose the standard REST API through public-api.wordpress.com (the /wp-json path on the subdomain returns 404).
const WP_API = "https://public-api.wordpress.com/wp/v2/sites/thebigbackclub.wordpress.com";
const blogHome = "https://thebigbackclub.wordpress.com/";
const siteHome = window.location.pathname;
const fallbackTopics = {
  science: { title: "Why does chilli burn?", description: "Discover how capsaicin tricks your brain into sensing heat.", search: "food science" },
  health: { title: "What is food actually doing in your body?", description: "Explore the research behind everyday ingredients and the way you eat.", search: "health" },
  travel: { title: "A city, one bite at a time.", description: "Follow the flavours, street food and food culture worth travelling for.", search: "travel" }
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach(item => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
  items.forEach(item => observer.observe(item));
}

function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  if (!toggle) return;
  const drawer = document.createElement("aside");
  drawer.className = "side-drawer";
  drawer.id = "side-drawer";
  drawer.setAttribute("aria-label", "Site navigation");
  drawer.innerHTML = '<button class="drawer-close" aria-label="Close navigation">×</button><nav>'
    + '<a href="index.html">Home</a>'
    + '<a href="archive.html">All stories</a>'
    + '<a class="drawer-sub" href="archive.html?cat=science">Food science</a>'
    + '<a class="drawer-sub" href="archive.html?cat=health">Food health</a>'
    + '<a class="drawer-sub" href="archive.html?cat=travel">Travel</a>'
    + '<a href="explore.html">Explore</a>'
    + '<a href="about.html">My appetite</a></nav>';
  const scrim = document.createElement("div");
  scrim.className = "drawer-scrim";
  document.body.append(drawer, scrim);
  toggle.setAttribute("aria-controls", "side-drawer");
  function setOpen(open) {
    drawer.classList.toggle("open", open);
    scrim.classList.toggle("open", open);
    document.body.classList.toggle("drawer-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    if (open) drawer.querySelector("a").focus(); else if (drawer.contains(document.activeElement)) toggle.focus();
  }
  toggle.addEventListener("click", () => setOpen(!drawer.classList.contains("open")));
  scrim.addEventListener("click", () => setOpen(false));
  drawer.querySelector(".drawer-close").addEventListener("click", () => setOpen(false));
  drawer.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", event => { if (event.key === "Escape") setOpen(false); });
}

function initTopicPicker() {
  const buttons = document.querySelectorAll(".topic-option");
  const title = document.querySelector(".result-title");
  const description = document.querySelector(".result-description");
  const link = document.querySelector(".result-link");
  buttons.forEach(button => button.addEventListener("click", () => {
    const topic = fallbackTopics[button.dataset.topic];
    if (!topic) return;
    buttons.forEach(item => item.classList.toggle("active", item === button));
    title.textContent = topic.title;
    description.textContent = topic.description;
    link.href = "archive.html";
    const result = document.querySelector(".topic-result");
    result.animate?.([{ transform: "translateY(5px)", opacity: .65 }, { transform: "translateY(0)", opacity: 1 }], { duration: 240, easing: "ease-out" });
  }));
}

function plainText(html) {
  const element = document.createElement("div");
  element.innerHTML = html || "";
  return (element.textContent || element.innerText || "").replace(/\s+/g, " ").trim();
}

function categoryFor(post) {
  const terms = post?._embedded?.["wp:term"]?.flat?.() || [];
  const names = terms.map(term => plainText(term.name)).filter(Boolean);
  const pick = names.find(name => /science|health|travel/i.test(name)) || names[0] || "From the journal";
  return pick.charAt(0).toUpperCase() + pick.slice(1);
}

function firstContentImage(html) {
  const holder = document.createElement("div");
  holder.innerHTML = html || "";
  const img = holder.querySelector("img");
  const src = img?.getAttribute("src") || "";
  return src.split("?")[0] ? src : "";
}

function ownImage(post) {
  const media = post?._embedded?.["wp:featuredmedia"]?.[0];
  const sizes = media?.media_details?.sizes || {};
  return post?.jetpack_featured_media_url || sizes.large?.source_url || sizes.medium_large?.source_url || media?.source_url || "";
}

function postImage(post, index) {
  return ownImage(post) || firstContentImage(post?.content?.rendered) || "";
}

function makePostCard(post, index) {
  const article = document.createElement("article");
  article.className = "feature-card reveal";
  const title = plainText(post.title?.rendered) || "A story from the journal";
  const fullExcerpt = plainText(post.excerpt?.rendered);
  const excerpt = fullExcerpt.length > 150 ? fullExcerpt.slice(0, 150).replace(/\s+\S*$/, "") + "…" : fullExcerpt;
  const category = categoryFor(post);
  const date = post.date ? new Date(post.date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "THE JOURNAL";
  const url = siteHome + "?article=" + encodeURIComponent(post.slug || "");
  const image = postImage(post, index);
  const readingTime = Math.max(2, Math.round(plainText(post.content?.rendered).split(/\s+/).filter(Boolean).length / 220));
  article.dataset.category = category;
  article.innerHTML = `
    <a class="feature-image live-image${image ? "" : " no-photo"}" href="${url}" aria-label="Read: ${escapeAttribute(title)}"${image ? ` style="background-image:url('${escapeCssUrl(image)}')"` : ""}>
      <span class="image-index">FIELD NOTE ${String(index + 1).padStart(3, "0")}</span><span class="image-arrow">↗</span>
    </a>
    <div class="card-meta"><span>${escapeHtml(category.toUpperCase())}</span><span>${readingTime} MIN READ</span></div>
    <h3><a href="${url}">${escapeHtml(title)}</a></h3>
    <p>${escapeHtml(excerpt || "A little more to discover about the food on your plate and the world around it.")}</p>
    <a class="text-link" href="${url}">READ THE STORY <span>↗</span></a>`;
  if (image) {
    const probe = new Image();
    probe.onerror = () => {
      const link = article.querySelector(".feature-image");
      if (!link) return;
      link.style.backgroundImage = "";
      link.classList.add("no-photo");
    };
    probe.src = image;
  }
  return article;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}
function escapeAttribute(value) { return escapeHtml(value); }
function escapeCssUrl(value) { return String(value).replace(/['"\\()\n\r]/g, ""); }


function formatArticleDate(value) {
  if (!value) return "FROM THE JOURNAL";
  return new Date(value).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
}

// Links to other posts of the journal stay inside this site instead of opening WordPress.
function keepLinksOnSite(html) {
  const holder = document.createElement("div");
  holder.innerHTML = html;
  holder.querySelectorAll("a[href]").forEach(anchor => {
    const match = anchor.getAttribute("href").match(/^https?:\/\/thebigbackclub\.wordpress\.com\/\d{4}\/\d{2}\/\d{2}\/([^/?#]+)/);
    if (match) anchor.setAttribute("href", siteHome + "?article=" + encodeURIComponent(match[1]));
    else if (/^https?:/i.test(anchor.getAttribute("href"))) { anchor.setAttribute("target", "_blank"); anchor.setAttribute("rel", "noreferrer noopener"); }
  });
  return holder.innerHTML;
}

function readerBackTarget() {
  const onArchive = /archive\.html$/.test(window.location.pathname);
  return onArchive
    ? { href: "archive.html", label: "← BACK TO ALL STORIES" }
    : { href: "index.html", label: "← BACK TO THE JOURNAL" };
}

async function loadWordPressArticle(slug) {
  const main = document.querySelector("main");
  if (!main) return;
  const back = readerBackTarget();
  main.innerHTML = '<section class="reader-loading"><span class="eyebrow">OPENING THE NOTEBOOK</span><h1>One moment, curiosity is loading.</h1></section>';
  try {
    const response = await fetch(WP_API + "/posts?slug=" + encodeURIComponent(slug) + "&_embed=1", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("WordPress returned " + response.status);
    const posts = await response.json();
    if (!Array.isArray(posts) || !posts.length) throw new Error("Article not found");
    const post = posts[0];
    const title = plainText(post.title?.rendered) || "A story from the journal";
    const category = categoryFor(post);
    const image = ownImage(post);
    const articleContent = keepLinksOnSite(post.content?.rendered || "<p>This article does not have any published content yet.</p>");
    main.innerHTML = `
      <article class="reader-page">
        <div class="reader-topline"><a href="${back.href}">${back.label}</a></div>
        <header class="reader-heading">
          <span class="eyebrow">${escapeHtml(category.toUpperCase())} · ${escapeHtml(formatArticleDate(post.date).toUpperCase())}</span>
          <h1>${escapeHtml(title)}</h1>
          <p class="reader-deck">${escapeHtml(plainText(post.excerpt?.rendered))}</p>
          <div class="reader-byline"><span>THE BIG BACK CLUB</span><span>WHERE FOOD MEETS SCIENCE</span></div>
        </header>
        ${image ? `<figure class="reader-cover"><img src="${escapeAttribute(image)}" alt="${escapeAttribute(plainText(post.title?.rendered))}" fetchpriority="high"></figure>` : ""}
        <div class="reader-content-wrap">
          <div class="reader-content">${articleContent}</div>
        </div>
        <footer class="reader-end"><span class="reader-end-star">✳</span><a class="dark-button" href="archive.html">KEEP EXPLORING <span>↗</span></a></footer>
      </article>`;
    document.querySelectorAll(".reader-content > *").forEach(el => el.classList.add("reveal")); initReveal();
    document.title = title + " — The Big Back Club";
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  } catch (error) {
    main.innerHTML = `<section class="reader-loading"><span class="eyebrow">A LITTLE DETOUR</span><h1>That story couldn’t be found.</h1><p>It may have moved, or the journal may be taking a moment to respond.</p><a class="dark-button" href="${back.href}">${back.label.replace("← ", "")} <span>↗</span></a></section>`;
    console.error("Could not load WordPress article:", error);
  }
}


function initFallbackArticleLinks() {
  const grid = document.querySelector(".featured-grid");
  if (!grid) return;
  grid.querySelectorAll("a[href='#latest']").forEach(link => {
    link.addEventListener("click", async event => {
      const card = link.closest(".feature-card");
      const heading = card?.querySelector("h3")?.textContent?.trim();
      if (!heading) return;
      event.preventDefault();
      const originalText = link.textContent;
      link.setAttribute("aria-busy", "true");
      try {
        const query = heading.includes("cookie") ? "cookie science" :
          heading.toLowerCase().includes("matcha") ? "matcha" :
          heading.toLowerCase().includes("chilli") ? "spicy food" : heading;
        const response = await fetch(WP_API + "/posts?search=" + encodeURIComponent(query) + "&per_page=5&_embed=1", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("WordPress returned " + response.status);
        const posts = await response.json();
        if (!Array.isArray(posts) || !posts.length) throw new Error("No matching published article found");
        const post = posts.find(item => {
          const title = plainText(item.title?.rendered).toLowerCase();
          return heading.toLowerCase().split(/\\W+/).filter(word => word.length > 4).some(word => title.includes(word));
        }) || posts[0];
        const slug = post.slug;
        if (!slug) throw new Error("The article has no WordPress slug");
        history.pushState({}, "", siteHome + "?article=" + encodeURIComponent(slug));
        await loadWordPressArticle(slug);
      } catch (error) {
        console.error("Could not open the selected story:", error);
        const main = document.querySelector("main");
        if (main) {
          const back = readerBackTarget();
          main.innerHTML = '<section class="reader-loading"><span class="eyebrow">THE JOURNAL IS TAKING A MOMENT</span><h1>This story couldn’t load just now.</h1><p>Please check your connection and try again.</p><a class="dark-button" href="' + back.href + '">' + back.label.replace("← ", "") + ' <span>↗</span></a></section>';
          window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        }
      } finally {
        link.removeAttribute("aria-busy");
      }
    });
  });
}

async function loadWordPressPosts() {
  const grid = document.querySelector(".featured-grid");
  if (!grid) return;
  try {
    const response = await fetch(WP_API + "/posts?per_page=3&status=publish&_embed=1&orderby=date&order=desc", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("WordPress returned " + response.status);
    const posts = await response.json();
    if (!Array.isArray(posts) || posts.length === 0) return;
    grid.replaceChildren(...posts.map(makePostCard));
    initReveal();
  } catch (error) {
    console.info("Using the built-in journal preview because the WordPress feed could not be loaded.", error);
  }
}

async function loadArchive() {
  const section = document.querySelector("#archive");
  const grid = document.querySelector(".archive-grid");
  if (!section || !grid) return;
  const chips = section.querySelector(".archive-filters");
  const count = section.querySelector(".archive-count");
  try {
    let posts = [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await fetch(WP_API + "/posts?per_page=100&page=" + page + "&status=publish&_embed=1&orderby=date&order=desc", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("WordPress returned " + response.status);
      totalPages = Number(response.headers.get("X-WP-TotalPages")) || 1;
      posts = posts.concat(await response.json());
      page += 1;
    } while (page <= totalPages);
    if (!posts.length) return;
    const cards = posts.map((post, index) => makePostCard(post, index));
    cards.forEach(card => card.classList.add("is-visible"));
    grid.replaceChildren(...cards);
    if (count) count.textContent = posts.length + (posts.length === 1 ? " STORY" : " STORIES");
    const categories = [...new Set(cards.map(card => card.dataset.category))];
    if (chips && categories.length > 1) {
      chips.innerHTML = "";
      ["All", ...categories].forEach((name, position) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = name;
        button.className = "archive-chip" + (position === 0 ? " active" : "");
        button.addEventListener("click", () => {
          chips.querySelectorAll(".archive-chip").forEach(chip => chip.classList.toggle("active", chip === button));
          cards.forEach(card => { card.hidden = position !== 0 && card.dataset.category !== name; });
        });
        chips.appendChild(button);
      });
    }
    section.hidden = false;
    const wanted = (new URLSearchParams(window.location.search).get("cat") || "").toLowerCase();
    if (wanted && chips) {
      const match = [...chips.querySelectorAll(".archive-chip")].find(chip => chip.textContent.toLowerCase().includes(wanted));
      if (match) match.click();
    }
  } catch (error) {
    console.info("Could not load the full story archive.", error);
  }
}

function initImageMotion() {
  const photo = document.querySelector(".hero-photo");
  if (!photo || reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  photo.addEventListener("pointermove", event => {
    const bounds = photo.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    photo.style.backgroundPosition = `${50 + x * 3}% ${52 + y * 3}%`;
  });
  photo.addEventListener("pointerleave", () => { photo.style.backgroundPosition = "center 52%"; });
}

function initMicroInteractions() {
  const note = document.querySelector(".cursor-note");
  if (!note) return;
  document.querySelectorAll(".feature-image, .round-link, .header-cta, .dark-button").forEach(element => {
    element.addEventListener("mouseenter", () => {
      note.classList.add("show");
      if (element.classList.contains("feature-image")) note.textContent = "go on, have a look ↗";
      else if (element.classList.contains("round-link")) note.textContent = "down you go ↓";
      else note.textContent = "nice choice ↗";
    });
    element.addEventListener("mouseleave", () => note.classList.remove("show"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initMenu();
  initTopicPicker();
  initImageMotion();
  initMicroInteractions();
  initFallbackArticleLinks();
  const articleSlug = new URLSearchParams(window.location.search).get("article");
  if (articleSlug) loadWordPressArticle(articleSlug);
  else { loadWordPressPosts(); loadArchive(); }
});

(function scrollMotion() {
  if (reduceMotion) return;
  document.documentElement.classList.add("js-motion");
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  const photo = document.querySelector(".hero-photo");
  let ticking = false;
  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
    if (photo && scrollY < innerHeight * 1.5) {
      photo.style.setProperty("--py", (scrollY * 0.08).toFixed(1) + "px");
      photo.style.setProperty("--ps", (1 + Math.min(scrollY, 600) / 6000).toFixed(4));
    }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
  document.querySelectorAll(".featured-grid, .archive-grid").forEach(grid => {
    [...grid.children].forEach((el, i) => el.style.setProperty("--d", (i % 3) * 0.12 + "s"));
  });
})();
