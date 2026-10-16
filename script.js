const WP_API = "https://thebigbackclub.wordpress.com/wp-json/wp/v2";
const blogHome = "https://thebigbackclub.wordpress.com/";
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
    link.href = blogHome + "?s=" + encodeURIComponent(topic.search);
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
  const url = post.link || blogHome;
  const image = postImage(post, index);
  const readingTime = Math.max(2, Math.round(plainText(post.content?.rendered).split(/\s+/).filter(Boolean).length / 220));
  article.dataset.category = category;
  article.innerHTML = `
    <a class="feature-image live-image" href="${url}" target="_blank" rel="noreferrer" aria-label="Read: ${escapeAttribute(title)}" style="background-image:url('${escapeCssUrl(image)}')">
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
  loadWordPressPosts();
});