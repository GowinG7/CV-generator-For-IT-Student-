const STORAGE_KEY = "cv_generator_pro_draft_v1";

const refs = {
  fullName: document.getElementById("fullName"),
  summary: document.getElementById("summary"),
  phone: document.getElementById("phone"),
  email: document.getElementById("email"),
  location: document.getElementById("location"),
  website: document.getElementById("website"),
  linkedin: document.getElementById("linkedin"),
  github: document.getElementById("github"),
  skills: document.getElementById("skills"),
  languages: document.getElementById("languages"),
  accentColor: document.getElementById("accentColor"),
  fontStyle: document.getElementById("fontStyle"),
  photoInput: document.getElementById("photoInput"),
  experienceList: document.getElementById("experienceList"),
  educationList: document.getElementById("educationList"),
  projectList: document.getElementById("projectList"),
  certificationList: document.getElementById("certificationList"),
  achievementList: document.getElementById("achievementList"),
  outName: document.getElementById("outName"),
  outContact: document.getElementById("outContact"),
  outSummary: document.getElementById("outSummary"),
  outPhoto: document.getElementById("outPhoto"),
  outExperience: document.getElementById("outExperience"),
  outEducation: document.getElementById("outEducation"),
  outProjects: document.getElementById("outProjects"),
  outCertifications: document.getElementById("outCertifications"),
  outAchievements: document.getElementById("outAchievements"),
  outSkills: document.getElementById("outSkills"),
  outLanguages: document.getElementById("outLanguages"),
  summarySec: document.getElementById("summarySec"),
  experienceSec: document.getElementById("experienceSec"),
  educationSec: document.getElementById("educationSec"),
  projectsSec: document.getElementById("projectsSec"),
  certificationsSec: document.getElementById("certificationsSec"),
  achievementsSec: document.getElementById("achievementsSec"),
  skillsSec: document.getElementById("skillsSec"),
  languagesSec: document.getElementById("languagesSec"),
  resumePaper: document.getElementById("resumePaper"),
  resumeContent: document.getElementById("resumeContent"),
  addExperience: document.getElementById("addExperience"),
  addEducation: document.getElementById("addEducation"),
  addProject: document.getElementById("addProject"),
  addCertification: document.getElementById("addCertification"),
  addAchievement: document.getElementById("addAchievement"),
  downloadPdf: document.getElementById("downloadPdf"),
  printView: document.getElementById("printView"),
};

let photoDataUrl = "";
let isRestoringState = false;

const DEFAULT_STATE = {
  accentColor: "#0d6e6e",
  fontStyle: "modern",
  experience: [{}],
  education: [{}],
  projects: [{}],
  certifications: [{}],
  achievements: [{}],
};

function persistState() {
  if (isRestoringState) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
  } catch (_error) {
    // Ignore storage errors (private mode/quota) and keep app functional.
  }
}

function parseMultiValue(text) {
  return text
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDetails(text) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getOrdinalSuffix(day) {
  const mod10 = day % 10;
  const mod100 = day % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "st";
  }
  if (mod10 === 2 && mod100 !== 12) {
    return "nd";
  }
  if (mod10 === 3 && mod100 !== 13) {
    return "rd";
  }

  return "th";
}

function formatFullDate(day, monthIndex, year) {
  const month = new Date(year, monthIndex, day).toLocaleString("en-US", {
    month: "long",
  });
  return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
}

function formatPeriodValue(value) {
  if (!value) {
    return "";
  }

  const raw = value.trim();

  if (/^\d{4}$/.test(raw)) {
    return raw;
  }

  if (/^present$/i.test(raw)) {
    return "Present";
  }

  const dayMonthYearMatch = raw.match(
    /^(?<day>\d{1,2})(?:st|nd|rd|th)?\s+(?<month>[A-Za-z]{3,9}),?\s+(?<year>\d{4})$/i
  );
  if (dayMonthYearMatch) {
    const day = Number(dayMonthYearMatch.groups.day);
    const year = Number(dayMonthYearMatch.groups.year);
    const parsed = new Date(
      `${dayMonthYearMatch.groups.month} ${day}, ${dayMonthYearMatch.groups.year}`
    );

    if (!Number.isNaN(parsed.getTime()) && day >= 1 && day <= 31) {
      return formatFullDate(day, parsed.getMonth(), year);
    }
  }

  const isoDateMatch = raw.match(/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/);
  if (isoDateMatch) {
    const year = Number(isoDateMatch.groups.year);
    const month = Number(isoDateMatch.groups.month) - 1;
    const day = Number(isoDateMatch.groups.day);
    const parsed = new Date(year, month, day);

    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day
    ) {
      return formatFullDate(day, month, year);
    }
  }

  const monthYearMatch = raw.match(
    /^(?<month>[A-Za-z]{3,9})\s+(?<year>\d{4})$/
  );
  if (monthYearMatch) {
    const parsed = new Date(`${monthYearMatch.groups.month} 1, ${monthYearMatch.groups.year}`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
  }

  const isoMonthMatch = raw.match(/^(?<year>\d{4})-(?<month>\d{2})$/);
  if (isoMonthMatch) {
    const parsed = new Date(`${isoMonthMatch.groups.year}-${isoMonthMatch.groups.month}-01T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  return raw;
}

function formatPeriodLabel(start, end) {
  const startLabel = formatPeriodValue(start);
  const endLabel = end ? formatPeriodValue(end) : "Present";

  if (!startLabel && !endLabel) {
    return "";
  }

  if (!startLabel) {
    return endLabel;
  }

  return `${startLabel} - ${endLabel}`;
}

function create(type, tag, className) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  el.dataset.type = type;
  return el;
}

function createLabeledInput(label, className, placeholder, value, type = "text") {
  const wrap = document.createElement("label");
  wrap.textContent = label;

  const input = document.createElement("input");
  input.type = type;
  input.className = className;
  input.placeholder = placeholder;
  input.value = value || "";

  wrap.appendChild(input);
  return wrap;
}

function createLabeledTextArea(label, className, placeholder, value) {
  const wrap = document.createElement("label");
  wrap.textContent = label;

  const textarea = document.createElement("textarea");
  textarea.className = className;
  textarea.rows = 3;
  textarea.placeholder = placeholder;
  textarea.value = value || "";

  wrap.appendChild(textarea);
  return wrap;
}

function createPeriodFields(data = {}) {
  const grid = create("", "div", "grid-two");

  grid.appendChild(
    createLabeledInput(
      "Start Date",
      "exp-start",
      "Example: Jan 2022",
      data.start || ""
    )
  );
  grid.appendChild(
    createLabeledInput(
      "End Date",
      "exp-end",
      "Example: Jun 2024 or Present",
      data.end || ""
    )
  );

  const hint = document.createElement("p");
  hint.className = "field-hint";
  hint.textContent = "Use format like 6th February, 2026 and 10th May, 2026";

  const wrap = document.createElement("div");
  wrap.appendChild(grid);
  wrap.appendChild(hint);

  return wrap;
}

function makeExperienceItem(data = {}) {
  const item = create("experience", "div", "repeat-item");
  const grid = create("", "div", "grid-two");

  grid.appendChild(
    createLabeledInput("Company", "exp-company", "Company name", data.company)
  );
  grid.appendChild(
    createLabeledInput("Role", "exp-role", "Role title", data.role)
  );

  item.appendChild(grid);
  item.appendChild(createPeriodFields(data));
  item.appendChild(
    createLabeledTextArea(
      "Highlights (one per line)",
      "exp-details",
      "Explain the work you contribute as given role",
      data.details
    )
  );
  item.appendChild(removeButton());
  refs.experienceList.appendChild(item);
}

function makeEducationItem(data = {}) {
  const item = create("education", "div", "repeat-item");
  const grid = create("", "div", "grid-two");

  grid.appendChild(
    createLabeledInput("Institute", "edu-school", "School, colleges and University", data.school)
  );
  grid.appendChild(
    createLabeledInput("Degree", "edu-degree", "SEE, +2, Bachelor/masters degree", data.degree)
  );

  item.appendChild(grid);
  item.appendChild(
    createLabeledInput(
      "Date / Year",
      "edu-date",
      "provide year duration",
      data.date || ""
    )
  );
  item.appendChild(
    createLabeledTextArea(
      "Details",
      "edu-details",
      "CGPA or percentages or others",
      data.details
    )
  );
  item.appendChild(removeButton());
  refs.educationList.appendChild(item);
}

function makeProjectItem(data = {}) {
  const item = create("project", "div", "repeat-item");
  const grid = create("", "div", "grid-two");

  grid.appendChild(
    createLabeledInput("Project", "pro-name", "Project name", data.name)
  );
  grid.appendChild(
    createLabeledInput(
      "GitHub / Site Link",
      "pro-link",
      "github.com/username/project or yoursite.com/project",
      data.link
    )
  );

  item.appendChild(grid);
  item.appendChild(
    createLabeledTextArea(
      "Description",
      "pro-details",
      "Describe about the projects and what it solves for real life problem",
      data.details
    )
  );
  item.appendChild(removeButton());
  refs.projectList.appendChild(item);
}

function makeAchievementItem(data = {}) {
  const item = create("achievement", "div", "repeat-item");
  const grid = create("", "div", "grid-two");

  grid.appendChild(
    createLabeledInput("Title", "ach-title", "Award or milestone", data.title)
  );
  grid.appendChild(
    createLabeledInput("Year", "ach-year", "year of achievement", data.year)
  );

  item.appendChild(grid);
  item.appendChild(
    createLabeledTextArea(
      "Details",
      "ach-details",
      "Explain the impact or recognition.",
      data.details
    )
  );
  item.appendChild(removeButton());
  refs.achievementList.appendChild(item);
}

function makeCertificationItem(data = {}) {
  const item = create("certification", "div", "repeat-item");
  const grid = create("", "div", "grid-two");

  grid.appendChild(
    createLabeledInput(
      "Certification",
      "cert-name",
      "Certification name",
      data.name
    )
  );
  grid.appendChild(
    createLabeledInput("Issuer", "cert-issuer", "Issuing organization", data.issuer)
  );

  item.appendChild(grid);
  item.appendChild(
    createLabeledInput(
      "Date / Year",
      "cert-date",
      "Example: 2025 or Jan 2025",
      data.date || ""
    )
  );
  item.appendChild(
    createLabeledTextArea(
      "Details",
      "cert-details",
      "Optional details or credential notes",
      data.details
    )
  );
  item.appendChild(removeButton());
  refs.certificationList.appendChild(item);
}

function removeButton() {
  const wrap = create("", "div", "repeat-actions");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn small danger remove-item";
  btn.textContent = "Remove";
  wrap.appendChild(btn);
  return wrap;
}

function collectExperience() {
  return Array.from(refs.experienceList.querySelectorAll(".repeat-item")).map(
    (node) => ({
      company: node.querySelector(".exp-company").value.trim(),
      role: node.querySelector(".exp-role").value.trim(),
      start: node.querySelector(".exp-start").value.trim(),
      end: node.querySelector(".exp-end").value.trim(),
      details: node.querySelector(".exp-details").value.trim(),
    })
  );
}

function collectEducation() {
  return Array.from(refs.educationList.querySelectorAll(".repeat-item")).map(
    (node) => ({
      school: node.querySelector(".edu-school").value.trim(),
      degree: node.querySelector(".edu-degree").value.trim(),
      date: node.querySelector(".edu-date").value.trim(),
      details: node.querySelector(".edu-details").value.trim(),
    })
  );
}

function collectProjects() {
  return Array.from(refs.projectList.querySelectorAll(".repeat-item")).map(
    (node) => ({
      name: node.querySelector(".pro-name").value.trim(),
      link: node.querySelector(".pro-link").value.trim(),
      details: node.querySelector(".pro-details").value.trim(),
    })
  );
}

function collectAchievements() {
  return Array.from(refs.achievementList.querySelectorAll(".repeat-item")).map(
    (node) => ({
      title: node.querySelector(".ach-title").value.trim(),
      year: node.querySelector(".ach-year").value.trim(),
      details: node.querySelector(".ach-details").value.trim(),
    })
  );
}

function collectCertifications() {
  return Array.from(refs.certificationList.querySelectorAll(".repeat-item")).map(
    (node) => ({
      name: node.querySelector(".cert-name").value.trim(),
      issuer: node.querySelector(".cert-issuer").value.trim(),
      date: node.querySelector(".cert-date").value.trim(),
      details: node.querySelector(".cert-details").value.trim(),
    })
  );
}

function getState() {
  return {
    fullName: refs.fullName.value.trim(),
    summary: refs.summary.value.trim(),
    phone: refs.phone.value.trim(),
    email: refs.email.value.trim(),
    location: refs.location.value.trim(),
    website: refs.website.value.trim(),
    linkedin: refs.linkedin.value.trim(),
    github: refs.github.value.trim(),
    skills: refs.skills.value,
    languages: refs.languages.value,
    accentColor: refs.accentColor.value,
    fontStyle: refs.fontStyle.value,
    photoDataUrl,
    experience: collectExperience(),
    education: collectEducation(),
    projects: collectProjects(),
    certifications: collectCertifications(),
    achievements: collectAchievements(),
  };
}

function setSectionVisibility(node, condition) {
  node.style.display = condition ? "block" : "none";
}

async function copyText(text) {
  if (!text) {
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temp = document.createElement("textarea");
  temp.value = text;
  temp.setAttribute("readonly", "");
  temp.style.position = "fixed";
  temp.style.top = "-1000px";
  temp.style.left = "-1000px";
  document.body.appendChild(temp);
  temp.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(temp);

  if (!copied) {
    throw new Error("copy failed");
  }
}

function addCopyBehavior(el, text) {
  const originalTitle = el.title;

  el.addEventListener("click", async (event) => {
    const isOpenLinkIntent =
      el.tagName === "A" && (event.ctrlKey || event.metaKey || event.button === 1);

    if (isOpenLinkIntent) {
      return;
    }

    event.preventDefault();

    try {
      await copyText(text);
      el.classList.add("copied");
      el.title = "Copied";
      setTimeout(() => {
        el.classList.remove("copied");
        el.title = originalTitle;
      }, 900);
    } catch (_error) {
      alert("Copy failed. Please select and press Ctrl+C.");
    }
  });
}

function renderContact(state) {
  refs.outContact.innerHTML = "";

  const contacts = [
    { label: "Phone", value: state.phone, href: state.phone ? `tel:${state.phone}` : "" },
    { label: "Email", value: state.email, href: state.email ? `mailto:${state.email}` : "" },
    {
      label: "LinkedIn",
      value: state.linkedin,
      href: normalizeLink(state.linkedin),
    },
    { label: "GitHub", value: state.github, href: normalizeLink(state.github) },
    { label: "Website", value: state.website, href: normalizeLink(state.website) },
    { label: "Location", value: state.location, href: "" },
  ].filter((contact) => contact.value);

  contacts.forEach((contact) => {
    if (contact.href) {
      const a = document.createElement("a");
      a.className = "contact-chip";
      a.href = contact.href;
      if (contact.href.startsWith("http")) {
        a.target = "_blank";
        a.rel = "noreferrer noopener";
      }
      a.textContent = `${contact.label}: ${contact.value}`;
      a.title = "Click to copy (Ctrl/Cmd+Click to open link)";
      addCopyBehavior(a, contact.value);
      refs.outContact.appendChild(a);
      return;
    }

    const chip = document.createElement("span");
    chip.className = "contact-chip";
    chip.textContent = `${contact.label}: ${contact.value}`;
    chip.title = "Click to copy";
    addCopyBehavior(chip, contact.value);
    refs.outContact.appendChild(chip);
  });
}

function normalizeLink(value) {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function renderTimeline(container, items, type) {
  container.innerHTML = "";

  const valid = items.filter((item) => Object.values(item).some(Boolean));
  if (!valid.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No entries yet.";
    container.appendChild(empty);
    return false;
  }

  valid.forEach((item) => {
    const card = document.createElement("article");
    card.className = "timeline-item";

    const head = document.createElement("div");
    head.className = "timeline-head";

    const title = document.createElement("p");
    title.className = "timeline-title";

    const meta = document.createElement("p");
    meta.className = "timeline-meta";

    if (type === "experience") {
      title.textContent = [item.role, item.company].filter(Boolean).join(" - ");
      meta.textContent = formatPeriodLabel(item.start, item.end) || item.period || "";
    }

    if (type === "education") {
      title.textContent = [item.degree, item.school].filter(Boolean).join(" - ");
      meta.textContent =
        formatPeriodValue(item.date) ||
        formatPeriodLabel(item.start, item.end) ||
        item.period ||
        "";
    }

    if (type === "project") {
      title.textContent = item.name || "Project";
      meta.textContent = "";
    }

    if (type === "achievement") {
      title.textContent = item.title || "Achievement";
      meta.textContent = item.year || "";
    }

    if (type === "certification") {
      title.textContent = [item.name, item.issuer].filter(Boolean).join(" - ");
      meta.textContent = formatPeriodValue(item.date) || "";
    }

    if (!meta.textContent) {
      meta.style.display = "none";
    }

    head.appendChild(title);
    head.appendChild(meta);
    card.appendChild(head);

    const details =
      type === "project" ? parseDetails(item.details) : parseDetails(item.details);
    if (details.length) {
      const ul = document.createElement("ul");
      details.forEach((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }

    if (type === "project" && item.link) {
      const a = document.createElement("a");
      a.href = item.link.startsWith("http") ? item.link : `https://${item.link}`;
      a.target = "_blank";
      a.rel = "noreferrer noopener";
      a.textContent = item.link;
      card.appendChild(a);
    }

    container.appendChild(card);
  });

  return true;
}

function renderPlainList(container, list) {
  container.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Not provided.";
    container.appendChild(empty);
    return false;
  }

  const ul = document.createElement("ul");
  ul.className = "plain-list";

  list.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    ul.appendChild(li);
  });

  container.appendChild(ul);
  return true;
}

function renderChips(container, list) {
  container.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Not provided.";
    container.appendChild(empty);
    return false;
  }

  list.forEach((value) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = value;
    container.appendChild(chip);
  });

  return true;
}

function render() {
  const state = getState();

  document.documentElement.style.setProperty("--accent", state.accentColor || "#0d6e6e");
  refs.resumePaper.classList.remove(
    "font-modern",
    "font-clean",
    "font-elegant",
    "font-classic"
  );
  const fontClassMap = {
    clean: "font-clean",
    elegant: "font-elegant",
    classic: "font-classic",
    modern: "font-modern",
  };
  refs.resumePaper.classList.add(fontClassMap[state.fontStyle] || "font-modern");

  refs.outName.textContent = state.fullName || "Your Name";
  refs.outSummary.textContent = state.summary || "Add a concise professional summary.";
  setSectionVisibility(refs.summarySec, Boolean(state.summary));

  refs.outPhoto.src = state.photoDataUrl || "";
  refs.outPhoto.style.display = state.photoDataUrl ? "block" : "none";

  renderContact(state);

  const hasExp = renderTimeline(refs.outExperience, state.experience, "experience");
  const hasEdu = renderTimeline(refs.outEducation, state.education, "education");
  const hasProjects = renderTimeline(refs.outProjects, state.projects, "project");
  const hasCertifications = renderTimeline(
    refs.outCertifications,
    state.certifications,
    "certification"
  );
  const hasAchievements = renderTimeline(
    refs.outAchievements,
    state.achievements,
    "achievement"
  );

  setSectionVisibility(refs.experienceSec, hasExp);
  setSectionVisibility(refs.educationSec, hasEdu);
  setSectionVisibility(refs.projectsSec, hasProjects);
  setSectionVisibility(refs.certificationsSec, hasCertifications);
  setSectionVisibility(refs.achievementsSec, hasAchievements);

  const hasSkills = renderChips(refs.outSkills, parseMultiValue(state.skills));
  const hasLanguages = renderChips(
    refs.outLanguages,
    parseMultiValue(state.languages)
  );

  setSectionVisibility(refs.skillsSec, hasSkills);
  setSectionVisibility(refs.languagesSec, hasLanguages);

  renderPagedPreview();
  persistState();
}

function stripCloneIds(root) {
  if (!root) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    root.removeAttribute("id");
  }

  root.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
}

function renderPagedPreview() {
  const paper = refs.resumePaper;
  const content = refs.resumeContent;

  if (!paper || !content) {
    return;
  }

  // Ensure we are in paged mode (stacked A4 pages).
  paper.classList.add("paged");

  const existingPages = paper.querySelector(".resume-pages");
  const pagesWrap = existingPages || document.createElement("div");
  pagesWrap.className = "resume-pages";

  if (!existingPages) {
    paper.insertBefore(pagesWrap, content);
  }

  // Calculate page sizing using the current rendered width.
  const pageHeightPx = (paper.clientWidth * 297) / 210;
  const topPadFirstPx = 0;
  const topPadNextPx = 20;
  const bottomPadPx = 18;

  // Epsilon avoids phantom extra pages due to fractional layout rounding.
  const epsilonPx = 3;
  const totalHeightPx = Math.max(0, Math.ceil(content.scrollHeight) - epsilonPx);

  // Collect breakpoints:
  // - Safe: ends/starts of blocks (avoid awkward splits, keep link with its item)
  // - Fallback: inside long items only when needed
  const contentRect = content.getBoundingClientRect();
  const safeBreaks = new Set([0, totalHeightPx]);
  const fallbackBreaks = new Set([totalHeightPx]);
  const timelineBlocks = [];

  content
    .querySelectorAll(".resume-section, .timeline-item")
    .forEach((node) => {
      const rect = node.getBoundingClientRect();
      const topOffset = Math.floor(rect.top - contentRect.top);
      const bottomOffset = Math.ceil(rect.bottom - contentRect.top);

      if (topOffset > 0 && topOffset < totalHeightPx) {
        safeBreaks.add(topOffset);
      }
      if (bottomOffset > 0 && bottomOffset < totalHeightPx) {
        safeBreaks.add(bottomOffset);
      }

      if (node.classList && node.classList.contains("timeline-item")) {
        if (topOffset >= 0 && bottomOffset > topOffset && bottomOffset <= totalHeightPx) {
          timelineBlocks.push({ top: topOffset, bottom: bottomOffset });
        }
      }
    });

  timelineBlocks.sort((a, b) => a.top - b.top);

  // Keep project links with the item by allowing a break AFTER the link (not before it).
  content
    .querySelectorAll(".timeline-item a")
    .forEach((node) => {
      const bottomOffset = Math.ceil(node.getBoundingClientRect().bottom - contentRect.top);
      if (bottomOffset > 0 && bottomOffset < totalHeightPx) {
        safeBreaks.add(bottomOffset);
      }
    });

  // If an item is too tall to fit, allow splitting at bullet boundaries.
  content
    .querySelectorAll(".timeline-item li")
    .forEach((node) => {
      const topOffset = Math.floor(node.getBoundingClientRect().top - contentRect.top);
      if (topOffset > 0 && topOffset < totalHeightPx) {
        fallbackBreaks.add(topOffset);
      }
    });

  const sortedSafe = Array.from(safeBreaks).sort((a, b) => a - b);
  const sortedFallback = Array.from(fallbackBreaks).sort((a, b) => a - b);

  pagesWrap.innerHTML = "";

  let startOffset = 0;
  let pageIndex = 0;
  const maxPagesSafety = 50;

  while (startOffset < totalHeightPx && pageIndex < maxPagesSafety) {
    const topPadPx = pageIndex === 0 ? topPadFirstPx : topPadNextPx;
    const usablePx = Math.max(1, pageHeightPx - topPadPx - bottomPadPx);
    const maxEnd = Math.min(totalHeightPx, startOffset + usablePx);

    // Ensure progress even if there are no good breakpoints nearby.
    const minAdvance = Math.min(140, Math.max(40, Math.floor(usablePx * 0.25)));
    const minEnd = Math.min(totalHeightPx, startOffset + minAdvance);

    let endOffset = 0;

    for (let i = sortedSafe.length - 1; i >= 0; i -= 1) {
      const candidate = sortedSafe[i];
      if (candidate > maxEnd) {
        continue;
      }
      if (candidate < minEnd) {
        break;
      }
      endOffset = candidate;
      break;
    }

    if (!endOffset) {
      for (let i = sortedFallback.length - 1; i >= 0; i -= 1) {
        const candidate = sortedFallback[i];
        if (candidate > maxEnd) {
          continue;
        }
        if (candidate < minEnd) {
          break;
        }
        endOffset = candidate;
        break;
      }
    }

    if (!endOffset || endOffset <= startOffset) {
      endOffset = maxEnd;
    }

    // Avoid cutting a whole timeline item at the bottom of a page.
    // If the chosen endOffset lands inside a timeline item (and we aren't already inside it),
    // push the entire item to the next page.
    let snapTo = null;
    for (let i = 0; i < timelineBlocks.length; i += 1) {
      const block = timelineBlocks[i];
      if (block.top >= endOffset) {
        break;
      }

      const cutsInside = endOffset > block.top && endOffset < block.bottom;
      const blockStartsOnThisPage = block.top > startOffset;
      const blockFitsOnPage = block.bottom - block.top <= usablePx + 1;

      if (cutsInside && blockStartsOnThisPage && blockFitsOnPage) {
        snapTo = block.top;
      }
    }

    if (snapTo !== null && snapTo > startOffset) {
      endOffset = snapTo;
    }

    const page = document.createElement("div");
    page.className = "resume-page";

    const viewport = document.createElement("div");
    viewport.className = "resume-page-viewport";
    viewport.style.paddingTop = `${topPadPx}px`;
    viewport.style.paddingBottom = `${bottomPadPx}px`;

    // Clip the slice explicitly to avoid any overlap/repetition across pages.
    const cutBottomPx = Math.max(0, Math.ceil(maxEnd - endOffset));
    const windowHeightPx = Math.max(
      1,
      Math.floor(pageHeightPx - topPadPx - bottomPadPx - cutBottomPx)
    );

    const windowEl = document.createElement("div");
    windowEl.className = "resume-page-window";
    windowEl.style.height = `${windowHeightPx}px`;

    const clone = content.cloneNode(true);
    stripCloneIds(clone);
    clone.classList.add("resume-content-clone");
    clone.style.transform = `translateY(-${startOffset}px)`;

    windowEl.appendChild(clone);
    viewport.appendChild(windowEl);
    page.appendChild(viewport);
    pagesWrap.appendChild(page);

    startOffset = endOffset;
    pageIndex += 1;
  }
}

function preparePrintLayout() {
  document.body.classList.add("printing");
  renderPagedPreview();
}

function cleanupPrintLayout() {
  document.body.classList.remove("printing");
  renderPagedPreview();
}

function clearRepeaters() {
  refs.experienceList.innerHTML = "";
  refs.educationList.innerHTML = "";
  refs.projectList.innerHTML = "";
  refs.certificationList.innerHTML = "";
  refs.achievementList.innerHTML = "";
}

function loadState(state) {
  isRestoringState = true;

  try {
    refs.fullName.value = state.fullName || "";
    refs.summary.value = state.summary || "";
    refs.phone.value = state.phone || "";
    refs.email.value = state.email || "";
    refs.location.value = state.location || "";
    refs.website.value = state.website || "";
    refs.linkedin.value = state.linkedin || "";
    refs.github.value = state.github || "";
    refs.skills.value = state.skills || "";
    refs.languages.value = state.languages || "";
    refs.accentColor.value = state.accentColor || "#0d6e6e";
    refs.fontStyle.value = state.fontStyle || "modern";

    photoDataUrl = state.photoDataUrl || "";

    clearRepeaters();
    (state.experience && state.experience.length ? state.experience : [{}]).forEach((item) =>
      makeExperienceItem(item)
    );
    (state.education && state.education.length ? state.education : [{}]).forEach((item) =>
      makeEducationItem(item)
    );
    (state.projects && state.projects.length ? state.projects : [{}]).forEach((item) =>
      makeProjectItem(item)
    );
    (state.certifications && state.certifications.length ? state.certifications : [{}]).forEach(
      (item) => makeCertificationItem(item)
    );
    (state.achievements && state.achievements.length ? state.achievements : [{}]).forEach(
      (item) => makeAchievementItem(item)
    );

    render();
  } finally {
    isRestoringState = false;
  }
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
}

function loadDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    loadState(parsed);
  } catch (_error) {
    alert("Saved draft is invalid and could not be loaded.");
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(getState(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cv-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPDF() {
  const button = refs.downloadPdf;
  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = "Saving PDF...";

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    document.body.classList.add("exporting-pdf");
    renderPagedPreview();

    try {
      const pdfBlob = await buildPdfBlobFromPreview();
      await savePdfBlob(pdfBlob, "professional-cv.pdf");
      return;
    } catch (blobError) {
      // Fall through to direct save and print alternatives.
      try {
        const fallbackBlob = await buildPdfBlobFromPreview();
        const opened = openBlobInNewTab(fallbackBlob);
        if (opened) {
          return;
        }
      } catch (_openBlobError) {
        // Continue to other fallbacks.
      }

      // Keep a reference for debugging in development tools if needed.
      window.__lastPdfExportError = blobError;
    }

    if (window.html2pdf) {
      try {
        await exportPdfDirectly();
        return;
      } catch (_directSaveError) {
        const openedFromDataUri = await openPdfDataUriInNewTab();
        if (openedFromDataUri) {
          return;
        }
      }
    }

    if (window.print) {
      window.print();
      return;
    }

    throw new Error("No export method available");
  } catch (_error) {
    if (window.print) {
      window.print();
      return;
    }

    alert("Unable to open print on this browser. Please try another browser.");
  } finally {
    document.body.classList.remove("exporting-pdf");
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function buildPdfBlobFromPreview() {
  const pageWidth = 210;
  const pageHeight = 297;
  const renderScale = Math.min(2, Math.max(1.2, window.devicePixelRatio || 1.5));

  const pagesWrap = refs.resumePaper
    ? refs.resumePaper.querySelector(".resume-pages")
    : null;
  const pages = pagesWrap
    ? Array.from(pagesWrap.querySelectorAll(":scope > .resume-page"))
    : [];

  if (window.html2canvas && pages.length) {
    const JsPdfCtor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    if (!JsPdfCtor) {
      throw new Error("PDF engine not available");
    }

    const pdf = new JsPdfCtor("p", "mm", "a4");

    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await window.html2canvas(pages[i], {
        scale: renderScale,
        useCORS: true,
        backgroundColor: null,
      });

      const imageData = canvas.toDataURL("image/jpeg", 1.0);
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight);
    }

    return pdf.output("blob");
  }

  if (window.html2canvas) {
    // Fallback: capture whatever is visible inside the paper.
    const canvas = await window.html2canvas(refs.resumePaper, {
      scale: renderScale,
      useCORS: true,
      backgroundColor: null,
    });

    const JsPdfCtor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    if (!JsPdfCtor) {
      throw new Error("PDF engine not available");
    }

    const pdf = new JsPdfCtor("p", "mm", "a4");
    const imageData = canvas.toDataURL("image/jpeg", 1.0);
    pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight);
    return pdf.output("blob");
  }

  if (window.html2pdf) {
    const worker = window.html2pdf()
      .from(refs.resumePaper)
      .set({
        margin: 0,
        filename: "professional-cv.pdf",
        image: { type: "jpeg", quality: 1 },
        pagebreak: { mode: ["css", "legacy"] },
        html2canvas: {
          scale: renderScale,
          useCORS: true,
          backgroundColor: null,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .toPdf();

    const pdf = await worker.get("pdf");
    return pdf.output("blob");
  }

  throw new Error("No PDF export engine available");
}

async function exportPdfDirectly() {
  if (!window.html2pdf) {
    throw new Error("html2pdf is unavailable");
  }

  const renderScale = Math.min(2, Math.max(1.2, window.devicePixelRatio || 1.5));

  await window
    .html2pdf()
    .set({
      margin: 0,
      filename: "professional-cv.pdf",
      image: { type: "jpeg", quality: 1 },
      pagebreak: { mode: ["css", "legacy"] },
      html2canvas: {
        scale: renderScale,
        useCORS: true,
        backgroundColor: null,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(refs.resumePaper)
    .save();
}

function openBlobInNewTab(blob) {
  if (!blob) {
    return false;
  }

  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  return Boolean(opened);
}

async function openPdfDataUriInNewTab() {
  if (!window.html2pdf) {
    return false;
  }

  const renderScale = Math.min(2, Math.max(1.2, window.devicePixelRatio || 1.5));
  const dataUri = await window
    .html2pdf()
    .set({
      margin: 0,
      image: { type: "jpeg", quality: 1 },
      pagebreak: { mode: ["css", "legacy"] },
      html2canvas: {
        scale: renderScale,
        useCORS: true,
        backgroundColor: null,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(refs.resumePaper)
    .outputPdf("datauristring");

  const opened = window.open(dataUri, "_blank", "noopener");
  return Boolean(opened);
}

async function savePdfBlob(blob, fileName) {
  if (!blob) {
    throw new Error("Missing PDF blob");
  }

  const canCreateFile = typeof File === "function";
  const file = canCreateFile
    ? new File([blob], fileName, { type: "application/pdf" })
    : null;

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "PDF document",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      return;
    } catch (_error) {
      // Fall through to the next mobile-friendly option.
    }
  }

  if (
    file &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: fileName,
        text: "CV PDF",
      });
      return;
    } catch (_error) {
      // Continue to the download fallback below.
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();

  if (typeof anchor.download === "undefined") {
    window.open(url, "_blank", "noopener");
  }

  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function bindEvents() {
  refs.addExperience.addEventListener("click", () => {
    makeExperienceItem();
    render();
  });

  refs.addEducation.addEventListener("click", () => {
    makeEducationItem();
    render();
  });

  refs.addProject.addEventListener("click", () => {
    makeProjectItem();
    render();
  });

  refs.addCertification.addEventListener("click", () => {
    makeCertificationItem();
    render();
  });

  refs.addAchievement.addEventListener("click", () => {
    makeAchievementItem();
    render();
  });

  refs.downloadPdf.addEventListener("click", downloadPDF);

  refs.photoInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      photoDataUrl = reader.result;
      render();
    };
    reader.readAsDataURL(file);
  });

  document.querySelector(".builder-panel").addEventListener("input", (event) => {
    if (event.target.id !== "photoInput") {
      render();
    }
  });

  document.querySelector(".builder-panel").addEventListener("change", (event) => {
    if (event.target.id !== "photoInput") {
      render();
    }
  });

  [
    refs.experienceList,
    refs.educationList,
    refs.projectList,
    refs.certificationList,
    refs.achievementList,
  ].forEach((list) => {
    list.addEventListener("click", (event) => {
      if (!event.target.classList.contains("remove-item")) {
        return;
      }
      const item = event.target.closest(".repeat-item");
      if (item) {
        item.remove();
      }

      if (!list.querySelector(".repeat-item")) {
        if (list === refs.experienceList) {
          makeExperienceItem();
        }
        if (list === refs.educationList) {
          makeEducationItem();
        }
        if (list === refs.projectList) {
          makeProjectItem();
        }
        if (list === refs.achievementList) {
          makeAchievementItem();
        }
        if (list === refs.certificationList) {
          makeCertificationItem();
        }
      }
      render();
    });
  });
}

bindEvents();
const existing = localStorage.getItem(STORAGE_KEY);
if (existing) {
  try {
    loadState(JSON.parse(existing));
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEY);
    loadState(DEFAULT_STATE);
  }
} else {
  loadState(DEFAULT_STATE);
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    renderPagedPreview();
  });
}

window.addEventListener("resize", () => {
  renderPagedPreview();
});
window.addEventListener("beforeprint", preparePrintLayout);
window.addEventListener("afterprint", cleanupPrintLayout);
