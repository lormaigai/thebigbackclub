const WP_API = "https://thebigbackclub.wordpress.com/wp-json/wp/v2";
const blogHome = "https://thebigbackclub.wordpress.com/";
const siteHome = window.location.pathname;
const fallbackTopics = {
  science: { title: "Why does chilli burn?", description: "Discover how capsaicin tricks your brain into sensing heat.", search: "food science" },
  health: { title: "What is food actually doing in your body?", description: "Explore the research behind everyday ingredients and the way we eat.", search: "health" },
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
  const nav = document.querySelector(".desktop-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
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
    link.href = "#latest";
    document.querySelector(".latest")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
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
  const names = terms.map(term => term.name).filter(Boolean);
  return names.find(name => /science|health|travel/i.test(name)) || names[0] || "From the journal";
}

function postImage(post, index) {
  const media = post?._embedded?.["wp:featuredmedia"]?.[0];
  const sizes = media?.media_details?.sizes || {};
  return sizes.large?.source_url || sizes.medium_large?.source_url || media?.source_url || [
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=900&q=85"
  ][index % 3];
}

function makePostCard(post, index) {
  const article = document.createElement("article");
  article.className = "feature-card reveal";
  const title = plainText(post.title?.rendered) || "A story from the journal";
  const excerpt = plainText(post.excerpt?.rendered).slice(0, 150);
  const category = categoryFor(post);
  const date = post.date ? new Date(post.date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "THE JOURNAL";
  const url = siteHome + "?article=" + encodeURIComponent(post.slug || "");
  const image = postImage(post, index);
  const readingTime = Math.max(2, Math.round(plainText(post.content?.rendered).split(/\s+/).filter(Boolean).length / 220));
  article.dataset.category = category;
  article.innerHTML = `
    <a class="feature-image live-image" href="${url}" aria-label="Read: ${escapeAttribute(title)}" style="background-image:url('${escapeCssUrl(image)}')">
      <span class="image-index">FIELD NOTE ${String(index + 1).padStart(3, "0")}</span><span class="image-arrow">↗</span>
    </a>
    <div class="card-meta"><span>${escapeHtml(category.toUpperCase())}</span><span>${readingTime} MIN READ</span></div>
    <h3><a href="${url}" target="_blank" rel="noreferrer">${escapeHtml(title)}</a></h3>
    <p>${escapeHtml(excerpt || "A little more to discover about the food we eat and the world around it.")}</p>
    <a class="text-link" href="${url}" target="_blank" rel="noreferrer">READ THE STORY <span>↗</span></a>`;
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

async function loadWordPressArticle(slug) {
  const main = document.querySelector("main");
  if (!main) return;
  main.innerHTML = '<section class="reader-loading"><span class="eyebrow">OPENING THE NOTEBOOK</span><h1>One moment, curiosity is loading.</h1></section>';
  try {
    const response = await fetch(WP_API + "/posts?slug=" + encodeURIComponent(slug) + "&_embed=1", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("WordPress returned " + response.status);
    const posts = await response.json();
    if (!Array.isArray(posts) || !posts.length) throw new Error("Article not found");
    const post = posts[0];
    const title = plainText(post.title?.rendered) || "A story from the journal";
    const category = categoryFor(post);
    const image = postImage(post, 0);
    const articleContent = post.content?.rendered || "<p>This article does not have any published content yet.</p>";
    main.innerHTML = `
      <article class="reader-page">
        <div class="reader-topline"><a href="${siteHome}">← BACK TO THE JOURNAL</a><span>THE BIG BACK CLUB / FIELD NOTES</span></div>
        <header class="reader-heading">
          <span class="eyebrow">${escapeHtml(category.toUpperCase())} · ${escapeHtml(formatArticleDate(post.date).toUpperCase())}</span>
          <h1>${escapeHtml(title)}</h1>
          <p class="reader-deck">${escapeHtml(plainText(post.excerpt?.rendered))}</p>
          <div class="reader-byline"><span>THE BIG BACK CLUB</span><span>WHERE FOOD MEETS SCIENCE</span></div>
        </header>
        ${image ? `<figure class="reader-cover"><img src="${escapeAttribute(image)}" alt="${escapeAttribute(plainText(post.title?.rendered))}" fetchpriority="high"></figure>` : ""}
        <div class="reader-content-wrap">
          <aside class="reader-side-note"><span>ON THE MENU</span><span>Food, questions<br>and a little science.</span><a href="${siteHome}#latest">MORE STORIES ↗</a></aside>
          <div class="reader-content">${articleContent}</div>
        </div>
        <footer class="reader-end"><span class="reader-end-star">✳</span><p>That’s food for thought.</p><a class="dark-button" href="${siteHome}#latest">KEEP EXPLORING <span>↗</span></a></footer>
      </article>`;
    document.title = title + " — The Big Back Club";
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  } catch (error) {
    main.innerHTML = `<section class="reader-loading"><span class="eyebrow">A LITTLE DETOUR</span><h1>We couldn’t find that story.</h1><p>It may have moved, or the journal may be taking a moment to respond.</p><a class="dark-button" href="${siteHome}#latest">BACK TO THE JOURNAL <span>↗</span></a></section>`;
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
          main.innerHTML = '<section class="reader-loading"><span class="eyebrow">THE JOURNAL IS TAKING A MOMENT</span><h1>We couldn’t load this story just now.</h1><p>Please check your connection and try again.</p><a class="dark-button" href="' + siteHome + '#latest">BACK TO THE JOURNAL <span>↗</span></a></section>';
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
      else if (element.classList.contains("round-link")) note.textContent = "down we go ↓";
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
  else loadWordPressPosts();
});