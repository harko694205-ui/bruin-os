import { todayStr, addDays, isPast, isToday, isTomorrow, isWithinDays, daysBetween, getWeekStart, getWeekDates } from './dates';

export function getIncompleteAssignments(assignments) {
  return assignments.filter((a) => !a.completed && a.dueDate);
}

export function getOverdue(assignments) {
  return getIncompleteAssignments(assignments).filter((a) => isPast(a.dueDate));
}

export function getDueToday(assignments) {
  return getIncompleteAssignments(assignments).filter((a) => isToday(a.dueDate));
}

export function getDueTomorrow(assignments) {
  return getIncompleteAssignments(assignments).filter((a) => isTomorrow(a.dueDate));
}

export function getDueThisWeek(assignments) {
  const weekStart = getWeekStart(todayStr());
  const weekDates = new Set(getWeekDates(weekStart));
  return getIncompleteAssignments(assignments).filter((a) => weekDates.has(a.dueDate));
}

export function getExamsInNext30(assignments) {
  return getIncompleteAssignments(assignments).filter(
    (a) => a.type === 'exam' && isWithinDays(a.dueDate, 30)
  );
}

export function getUpcoming(assignments, days = 14) {
  return getIncompleteAssignments(assignments)
    .filter((a) => isWithinDays(a.dueDate, days) || isPast(a.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getBusiestUpcomingWeek(assignments, events, weeksAhead = 6) {
  const items = [
    ...getIncompleteAssignments(assignments).map((a) => ({ date: a.dueDate })),
    ...events.filter((e) => e.date).map((e) => ({ date: e.date })),
  ];
  const counts = {};
  let cursor = getWeekStart(todayStr());
  const weekStarts = [];
  for (let i = 0; i < weeksAhead; i++) {
    weekStarts.push(cursor);
    counts[cursor] = 0;
    cursor = addDays(cursor, 7);
  }
  items.forEach(({ date }) => {
    if (!date) return;
    const ws = getWeekStart(date);
    if (counts[ws] !== undefined) counts[ws] += 1;
  });
  let busiest = null;
  let max = -1;
  weekStarts.forEach((ws) => {
    if (counts[ws] > max) {
      max = counts[ws];
      busiest = ws;
    }
  });
  return { weekStart: busiest, count: max };
}

export function getWorkloadSummary(assignments, events) {
  const dueThisWeek = getDueThisWeek(assignments);
  const examsNext30 = getExamsInNext30(assignments);
  const overdue = getOverdue(assignments);
  const majorTypes = new Set(['exam', 'project', 'paper', 'presentation']);
  const majorThisWeek = dueThisWeek.filter((a) => majorTypes.has(a.type));
  const busiest = getBusiestUpcomingWeek(assignments, events);

  let warning = null;
  const examsThisWeek = dueThisWeek.filter((a) => a.type === 'exam').length;
  const assignmentsThisWeek = dueThisWeek.length - examsThisWeek;
  if (examsThisWeek > 0 && assignmentsThisWeek > 0) {
    warning = `Heavy week ahead — ${examsThisWeek} exam${examsThisWeek > 1 ? 's' : ''} and ${assignmentsThisWeek} assignment${assignmentsThisWeek !== 1 ? 's' : ''}.`;
  } else if (dueThisWeek.length >= 4) {
    warning = `Busy week — ${dueThisWeek.length} things due.`;
  } else if (overdue.length > 0) {
    warning = `${overdue.length} overdue item${overdue.length > 1 ? 's' : ''} need attention.`;
  }

  return {
    dueThisWeekCount: dueThisWeek.length,
    examsNext30Count: examsNext30.length,
    majorThisWeekCount: majorThisWeek.length,
    overdueCount: overdue.length,
    busiestWeek: busiest,
    warning,
  };
}

const TYPE_TIME_HINTS = {
  exam: 120,
  quiz: 30,
  presentation: 90,
  paper: 90,
  project: 120,
  homework: 60,
  assignment: 45,
};

/**
 * Recommend tasks to work on given a time budget (in minutes).
 */
export function recommendTasks(assignments, availableMinutes) {
  const incomplete = getIncompleteAssignments(assignments);

  function priorityRank(a) {
    if (isPast(a.dueDate)) return 0;
    if (isToday(a.dueDate)) return 1;
    if (isTomorrow(a.dueDate)) return 2;
    if ((a.type === 'exam' || a.type === 'project') && isWithinDays(a.dueDate, 10)) return 3;
    return 4;
  }

  function reasonFor(a, rank) {
    switch (rank) {
      case 0: return `Overdue since ${a.dueDate}`;
      case 1: return 'Due today';
      case 2: return 'Due tomorrow';
      case 3: return `Major ${a.type} approaching`;
      default: return `Due ${daysBetween(todayStr(), a.dueDate)} days from now`;
    }
  }

  const scored = incomplete
    .map((a) => {
      const rank = priorityRank(a);
      const est = a.estimatedMinutes || TYPE_TIME_HINTS[a.type] || 45;
      return { ...a, _rank: rank, _est: est, _reason: reasonFor(a, rank) };
    })
    .sort((a, b) => {
      if (a._rank !== b._rank) return a._rank - b._rank;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

  // Prefer tasks that roughly fit the available time, but always surface top priority
  // items even if they run long — better to start something urgent than nothing.
  const fitsWell = scored.filter((a) => a._est <= availableMinutes + 15);
  const pool = fitsWell.length > 0 ? fitsWell : scored;

  return pool.slice(0, 5);
}
