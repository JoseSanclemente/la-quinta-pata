const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("revealed");
      observer.unobserve(entry.target);
    }
  },
  { threshold: 0.25 },
);

for (const el of document.querySelectorAll("[data-reveal]")) observer.observe(el);
