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
  achievementList: document.getElementById("achievementList"),
  outName: document.getElementById("outName"),
  outHeadline: document.getElementById("outHeadline"),
  outContact: document.getElementById("outContact"),
  outSummary: document.getElementById("outSummary"),
  outPhoto: document.getElementById("outPhoto"),
  outExperience: document.getElementById("outExperience"),
  outEducation: document.getElementById("outEducation"),
  outProjects: document.getElementById("outProjects"),
  outAchievements: document.getElementById("outAchievements"),
  outSkills: document.getElementById("outSkills"),
  outLanguages: document.getElementById("outLanguages"),
  summarySec: document.getElementById("summarySec"),
  experienceSec: document.getElementById("experienceSec"),
  educationSec: document.getElementById("educationSec"),
  projectsSec: document.getElementById("projectsSec"),
  achievementsSec: document.getElementById("achievementsSec"),
  skillsSec: document.getElementById("skillsSec"),
  languagesSec: document.getElementById("languagesSec"),
  resumePaper: document.getElementById("resumePaper"),
  resumeContent: document.getElementById("resumeContent"),
  addExperience: document.getElementById("addExperience"),
  addEducation: document.getElementById("addEducation"),
  addProject: document.getElementById("addProject"),
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
  hint.textContent = "Use a clear format like 4th Jan 2022 - 3rd Jun 2024";

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
  const hasAchievements = renderTimeline(
    refs.outAchievements,
    state.achievements,
    "achievement"
  );

  setSectionVisibility(refs.experienceSec, hasExp);
  setSectionVisibility(refs.educationSec, hasEdu);
  setSectionVisibility(refs.projectsSec, hasProjects);
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
  button.textContent = "Opening Print...";

  const prevTransform = refs.resumeContent.style.transform;
  const prevWidth = refs.resumeContent.style.width;

  const finish = () => {
    refs.resumeContent.style.transform = prevTransform;
    refs.resumeContent.style.width = prevWidth;
    fitResumeToSinglePage();
    document.body.classList.remove("exporting-pdf");
    button.disabled = false;
    button.textContent = originalLabel;
  };

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    document.body.classList.add("exporting-pdf");
    fitResumeToSinglePage();

    // Remove preview scaling to print exact layout with real selectable text and links.
    refs.resumeContent.style.transform = "none";
    refs.resumeContent.style.width = "100%";

    window.addEventListener("afterprint", finish, { once: true });
    window.print();

    // Fallback for browsers that do not reliably fire afterprint.
    setTimeout(() => {
      if (button.disabled) {
        finish();
      }
    }, 2000);
  } catch (_error) {
    finish();
    alert("Unable to open Print dialog. Please try again.");
  }
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
