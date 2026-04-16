const STORAGE_KEY = "cv_generator_pro_draft_v1";

const refs = {
  fullName: document.getElementById("fullName"),
  headline: document.getElementById("headline"),
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
  outHeadline: document.getElementById("outHeadline"),
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
      "Github Link",
      "pro-link",
      "https://github.com/username/project",
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
    headline: refs.headline.value.trim(),
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
        a.rel = "noreferrer";
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
      a.rel = "noreferrer";
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
  refs.outHeadline.textContent = state.headline || "Your Professional Title";
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

  fitResumeToSinglePage();
  persistState();
}

function fitResumeToSinglePage() {
  const paper = refs.resumePaper;
  const content = refs.resumeContent;

  if (!paper || !content) {
    return;
  }

  content.style.transform = "scale(1)";
  content.style.width = "100%";

  const availableHeight = paper.clientHeight;
  const contentHeight = content.scrollHeight;

  if (!availableHeight || !contentHeight) {
    return;
  }

  const scale = Math.min(1, availableHeight / contentHeight);
  if (scale < 1) {
    content.style.transform = `scale(${scale})`;
    content.style.width = `${100 / scale}%`;
  }
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
    refs.headline.value = state.headline || "";
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

    fitResumeToSinglePage();

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
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function buildPdfBlobFromPreview() {
  const pageWidth = 210;
  const renderScale = Math.min(2, Math.max(1.2, window.devicePixelRatio || 1.5));

  if (window.html2canvas) {
    try {
      const canvas = await window.html2canvas(refs.resumePaper, {
        scale: renderScale,
        useCORS: true,
        backgroundColor: null,
      });

      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const JsPdfCtor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;

      if (!JsPdfCtor) {
        throw new Error("PDF engine not available");
      }

      const pdf = new JsPdfCtor("p", "mm", "a4");
      const imageData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imageData, "JPEG", 0, 0, imageWidth, imageHeight);
      return pdf.output("blob");
    } catch (_canvasError) {
      // Try html2pdf worker next.
    }
  }

  if (window.html2pdf) {
    const worker = window.html2pdf()
      .from(refs.resumePaper)
      .set({
        margin: 0,
        filename: "professional-cv.pdf",
        image: { type: "jpeg", quality: 1 },
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

window.addEventListener("resize", fitResumeToSinglePage);
