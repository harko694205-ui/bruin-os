import { toDateStr, addDays } from './dates.js';

const MONTHS = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7,
  september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10, nov: 10,
  december: 11, dec: 11,
};

// Order matters: more specific categories are checked before generic catch-alls
// like "final" or "exam" so lines such as "Final project proposal due" or
// "Final paper due" classify as project/paper rather than exam.
const TYPE_KEYWORDS = [
  { type: 'presentation', words: ['presentation', 'present', 'pitch'] },
  { type: 'project', words: ['project', 'deliverable', 'milestone', 'capstone'] },
  { type: 'paper', words: ['paper', 'essay', 'draft', 'reflection'] },
  { type: 'quiz', words: ['quiz', 'pop quiz'] },
  { type: 'homework', words: ['homework', 'hw', 'problem set', 'pset'] },
  { type: 'exam', words: ['final exam', 'midterm exam', 'midterm', 'final', 'exam'] },
  { type: 'assignment', words: ['assignment', 'due', 'submission', 'submit'] },
];

function classifyType(line) {
  const lower = line.toLowerCase();
  for (const { type, words } of TYPE_KEYWORDS) {
    for (const w of words) {
      if (lower.includes(w)) return type;
    }
  }
  return 'assignment';
}

const WEEKDAY_PREFIX_RE = /^(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?)\.?,?\s*/i;

// Remove every matched date span (right-to-left so indexes stay valid), plus
// the connector words left behind when a line holds several dates.
function stripSpans(line, spans) {
  let out = line;
  [...spans].sort((a, b) => b.index - a.index).forEach(({ index, length }) => {
    out = out.slice(0, index) + ' ' + out.slice(index + length);
  });
  return out;
}

function cleanTitle(line, spans) {
  let title = stripSpans(line, spans).trim();
  // collapse leftovers like "Lecture  and  covers" -> "Lecture covers"
  title = title.replace(/\s+(?:and|or|&|to|through|thru)\s+(?=\s|$)/gi, ' ');
  title = title.replace(/\s+(?:and|or|&)\s+(?=(?:covers?|due|is|are)\b)/gi, ' ');
  // strip a leading weekday name that isn't part of the matched date (e.g. "Monday, November 2 - ...")
  title = title.replace(WEEKDAY_PREFIX_RE, '');
  // strip common separators/bullets at edges
  title = title.replace(/^[-–—:,*•\s]+/, '').replace(/[-–—:,*•\s]+$/, '');
  title = title.replace(/\s{2,}/g, ' ');
  if (title.length < 3) {
    // fall back to whole line minus punctuation
    title = line.replace(/[-–—:*•]/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }
  if (title.length > 90) title = title.slice(0, 90).trim() + '…';
  if (!title) title = 'Untitled item';
  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function resolveYear(month, day, referenceYear) {
  // Academic syllabi often span two calendar years (e.g. Fall term).
  // Heuristic: pick the year (referenceYear or referenceYear+1) that keeps
  // the date from being more than ~4 months in the past relative to today.
  const now = new Date();
  const candidates = [referenceYear - 1, referenceYear, referenceYear + 1];
  let best = referenceYear;
  let bestDiff = Infinity;
  for (const y of candidates) {
    const d = new Date(y, month, day);
    const diffDays = Math.abs((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < bestDiff) {
      bestDiff = diffDays;
      best = y;
    }
  }
  return best;
}

// Words right before / after a number pair that mean it is NOT a calendar date.
const NON_DATE_BEFORE_RE = /(?:pages?|pp?\.?|chapters?|ch\.?|sections?|sec\.?|problems?|questions?|exercises?|slides?|#)\s*$/i;
const NON_DATE_AFTER_RE = /^\s*(?:am|pm|a\.m\.|p\.m\.|cups?|%|points?|pts?)\b/i;

// Each matcher returns { index, length, month, day, year (optional) } or null
function findDateMatches(line, referenceYear) {
  const matches = [];

  // 1. Month name + day (+ optional year): "September 24", "Sep 24, 2026", "Sept. 24"
  const monthDayRe = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b/gi;
  let m;
  while ((m = monthDayRe.exec(line)) !== null) {
    const month = MONTHS[m[1].toLowerCase()];
    const day = parseInt(m[2], 10);
    if (day < 1 || day > 31) continue;
    const year = m[3] ? parseInt(m[3], 10) : resolveYear(month, day, referenceYear);
    matches.push({ index: m.index, length: m[0].length, month, day, year });
  }

  // 2. Numeric: 9/24, 09/24/2026, 9-24-26
  // Hyphenated numbers with no year ("pages 12-15", "2-3 pm", "chapters 3-4")
  // are far more often ranges than dates, so a hyphen date needs a year.
  const numericRe = /\b(\d{1,2})([/-])(\d{1,2})(?:[/-](\d{2,4}))?\b/g;
  while ((m = numericRe.exec(line)) !== null) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[3], 10);
    if (a < 1 || a > 12 || b < 1 || b > 31) continue;
    if (m[2] === '-' && !m[4]) continue; // looks like a range, not a date
    if (NON_DATE_BEFORE_RE.test(line.slice(0, m.index))) continue; // "pages 12/15", "ch. 3/4"
    if (NON_DATE_AFTER_RE.test(line.slice(m.index + m[0].length))) continue; // "2/3 pm", "3/4 cup"
    let year = m[4] ? parseInt(m[4], 10) : null;
    if (year !== null && year < 100) year += 2000;
    if (year === null) year = resolveYear(a - 1, b, referenceYear);
    // avoid double counting overlap with a month-name match at same index
    const overlaps = matches.some((mm) => m.index < mm.index + mm.length && mm.index < m.index + m[0].length);
    if (overlaps) continue;
    matches.push({ index: m.index, length: m[0].length, month: a - 1, day: b, year });
  }

  // 3. "Week N" — resolved later relative to quarter/term start if available
  const weekRe = /\bweek\s+(\d{1,2})\b/gi;
  while ((m = weekRe.exec(line)) !== null) {
    matches.push({ index: m.index, length: m[0].length, weekNum: parseInt(m[1], 10) });
  }

  // 4. Weekday names alone won't resolve to a date reliably without more context, skip.

  return matches.sort((x, y) => x.index - y.index);
}

/**
 * Parse raw syllabus text into an array of proposed events.
 * @param {string} text raw pasted syllabus text
 * @param {object} opts { referenceYear, termStart (YYYY-MM-DD) }
 */
export function parseSyllabus(text, opts = {}) {
  const referenceYear = opts.referenceYear || new Date().getFullYear();
  const termStart = opts.termStart || null;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results = [];
  const seen = new Set();

  lines.forEach((line, lineIdx) => {
    const allMatches = findDateMatches(line, referenceYear);
    if (allMatches.length === 0) return;

    // A concrete date on the line wins over a "Week N" reference.
    const concrete = allMatches.filter((m) => m.weekNum == null);
    let anchors = concrete.length > 0 ? concrete : [allMatches[0]];

    // "Oct 5 – Oct 9" is one range, not two events: keep the end (due) date.
    anchors = anchors.filter((m, i) => {
      const next = anchors[i + 1];
      if (!next) return true;
      const between = line.slice(m.index + m.length, next.index);
      return !/^\s*(?:-|–|—|to|through|thru|until)\s*$/i.test(between);
    });

    // One event per remaining date (e.g. "Lecture 9/28 and 10/5").
    anchors.forEach((primary, anchorIdx) => {
      let dateStr = null;

      if (primary.weekNum != null) {
        if (termStart) {
          dateStr = addDays(termStart, (primary.weekNum - 1) * 7);
        } else {
          return; // can't resolve week number without a term start date
        }
      } else {
        const d = new Date(primary.year, primary.month, primary.day);
        if (isNaN(d.getTime())) return;
        // reject overflow like Feb 31 -> Mar 3
        if (d.getMonth() !== primary.month || d.getDate() !== primary.day) return;
        dateStr = toDateStr(d);
      }

      const type = classifyType(line);
      // Strip every date span from the title (including range starts we skipped).
      const title = cleanTitle(line, allMatches);

      const dedupeKey = `${dateStr}|${title.toLowerCase()}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      results.push({
        tempId: `parsed_${lineIdx}_${anchorIdx}_${results.length}`,
        title,
        type,
        date: dateStr,
        sourceLine: line,
        include: true,
      });
    });
  });

  // Sort chronologically, unresolvable (null) dates last
  results.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return results;
}

export const EVENT_TYPE_LABELS = {
  exam: 'Exam',
  quiz: 'Quiz',
  presentation: 'Presentation',
  paper: 'Paper',
  project: 'Project',
  homework: 'Homework',
  assignment: 'Assignment',
  personal: 'Personal',
  class: 'Class',
};
