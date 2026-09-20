import { parseDateStr } from './dates';

// Returns unified calendar items for a single date string, sorted by time.
export function getItemsForDate(data, dateStr) {
  const { classes, assignments, events } = data;
  const dayIdx = parseDateStr(dateStr).getDay();

  const classItems = classes
    .filter((c) => c.days?.includes(dayIdx))
    .map((c) => ({
      kind: 'class',
      id: `class_${c.id}_${dateStr}`,
      refId: c.id,
      title: c.name,
      subtitle: c.room,
      time: c.startTime,
      endTime: c.endTime,
      color: c.color,
      date: dateStr,
    }));

  const assignmentItems = assignments
    .filter((a) => a.dueDate === dateStr)
    .map((a) => {
      const cls = classes.find((c) => c.id === a.classId);
      return {
        kind: 'assignment',
        id: a.id,
        refId: a.id,
        title: a.title,
        subtitle: cls ? (cls.code || cls.name) : null,
        type: a.type,
        time: null,
        color: cls?.color,
        completed: a.completed,
        date: dateStr,
        raw: a,
      };
    });

  const eventItems = events
    .filter((e) => {
      if (e.recurring) {
        if (!e.days?.includes(dayIdx)) return false;
        if (e.startDate && dateStr < e.startDate) return false;
        if (e.endDate && dateStr > e.endDate) return false;
        return true;
      }
      return e.date === dateStr;
    })
    .map((e) => {
      const cls = classes.find((c) => c.id === e.classId);
      return {
        kind: 'event',
        id: e.recurring ? `${e.id}_${dateStr}` : e.id,
        refId: e.id,
        title: e.title,
        subtitle: cls ? (cls.code || cls.name) : null,
        time: e.startTime || null,
        endTime: e.endTime || null,
        color: cls?.color || '#8b95a1',
        recurring: !!e.recurring,
        date: dateStr,
        raw: e,
      };
    });

  const all = [...classItems, ...eventItems, ...assignmentItems];
  all.sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });
  return all;
}

export function countItemsForDate(data, dateStr) {
  return getItemsForDate(data, dateStr).length;
}
