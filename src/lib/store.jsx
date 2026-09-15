import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'bruinos.v1';

const DEFAULT_DATA = {
  classes: [],
  assignments: [],
  events: [],
  links: [],
  focusSessions: [],
  settings: {
    theme: 'light',
    quarterStart: null, // ISO date string
    quarterEnd: null,
    quarterName: '',
  },
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DATA,
      ...parsed,
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
    };
  } catch (e) {
    console.error('Failed to load Bruin OS data, resetting.', e);
    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save Bruin OS data', e);
  }
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.settings.theme);
  }, [data.settings.theme]);

  const update = useCallback((fn) => {
    setData((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      return { ...prev, ...next };
    });
  }, []);

  // ---- Classes ----
  const addClass = useCallback((cls) => {
    const newClass = { id: uid('cls'), color: '#2C6E9E', ...cls };
    setData((prev) => ({ ...prev, classes: [...prev.classes, newClass] }));
    return newClass;
  }, []);

  const updateClass = useCallback((id, patch) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteClass = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
      assignments: prev.assignments.filter((a) => a.classId !== id),
      events: prev.events.filter((e) => e.classId !== id),
    }));
  }, []);

  // ---- Assignments (assignments, exams, projects, papers, etc.) ----
  const addAssignment = useCallback((item) => {
    const newItem = {
      id: uid('asn'),
      title: '',
      type: 'assignment',
      classId: null,
      dueDate: null,
      estimatedMinutes: 60,
      completed: false,
      notes: '',
      source: 'manual',
      ...item,
    };
    setData((prev) => ({ ...prev, assignments: [...prev.assignments, newItem] }));
    return newItem;
  }, []);

  const addAssignments = useCallback((items) => {
    setData((prev) => ({ ...prev, assignments: [...prev.assignments, ...items] }));
  }, []);

  const updateAssignment = useCallback((id, patch) => {
    setData((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  const deleteAssignment = useCallback((id) => {
    setData((prev) => ({ ...prev, assignments: prev.assignments.filter((a) => a.id !== id) }));
  }, []);

  const toggleAssignmentComplete = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === id ? { ...a, completed: !a.completed } : a
      ),
    }));
  }, []);

  // ---- Events (personal / manual calendar events) ----
  const addEvent = useCallback((evt) => {
    const newEvt = {
      id: uid('evt'),
      title: '',
      date: null,
      time: null,
      type: 'personal',
      classId: null,
      notes: '',
      ...evt,
    };
    setData((prev) => ({ ...prev, events: [...prev.events, newEvt] }));
    return newEvt;
  }, []);

  const updateEvent = useCallback((id, patch) => {
    setData((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const deleteEvent = useCallback((id) => {
    setData((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
  }, []);

  // ---- Links ----
  const addLink = useCallback((link) => {
    const newLink = {
      id: uid('lnk'),
      name: '',
      url: '',
      category: 'School',
      icon: '🔗',
      description: '',
      pinned: false,
      order: data.links.length,
      ...link,
    };
    setData((prev) => ({ ...prev, links: [...prev.links, newLink] }));
    return newLink;
  }, [data.links.length]);

  const updateLink = useCallback((id, patch) => {
    setData((prev) => ({
      ...prev,
      links: prev.links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }, []);

  const deleteLink = useCallback((id) => {
    setData((prev) => ({ ...prev, links: prev.links.filter((l) => l.id !== id) }));
  }, []);

  const reorderLinks = useCallback((orderedIds) => {
    setData((prev) => ({
      ...prev,
      links: prev.links
        .map((l) => ({ ...l, order: orderedIds.indexOf(l.id) }))
        .sort((a, b) => a.order - b.order),
    }));
  }, []);

  // ---- Focus sessions ----
  const addFocusSession = useCallback((session) => {
    const newSession = { id: uid('foc'), completedAt: new Date().toISOString(), ...session };
    setData((prev) => ({ ...prev, focusSessions: [...prev.focusSessions, newSession] }));
    return newSession;
  }, []);

  // ---- Settings ----
  const updateSettings = useCallback((patch) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const resetAllData = useCallback(() => {
    setData({ ...DEFAULT_DATA });
  }, []);

  // ---- Backup / restore ----
  const exportData = useCallback(() => {
    return {
      app: 'bruin-os',
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
  }, [data]);

  const importData = useCallback((parsed) => {
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'That file doesn\u2019t look like a Bruin OS backup.' };
    }
    const incoming = parsed.data && parsed.app === 'bruin-os' ? parsed.data : parsed;
    const requiredArrays = ['classes', 'assignments', 'events', 'links', 'focusSessions'];
    const hasShape = requiredArrays.every((k) => Array.isArray(incoming[k]));
    if (!hasShape) {
      return { success: false, error: 'This file is missing expected Bruin OS data and can\u2019t be imported.' };
    }
    setData({
      ...DEFAULT_DATA,
      ...incoming,
      settings: { ...DEFAULT_DATA.settings, ...(incoming.settings || {}) },
    });
    return { success: true };
  }, []);

  const value = {
    data,
    update,
    addClass,
    updateClass,
    deleteClass,
    addAssignment,
    addAssignments,
    updateAssignment,
    deleteAssignment,
    toggleAssignmentComplete,
    addEvent,
    updateEvent,
    deleteEvent,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    addFocusSession,
    updateSettings,
    resetAllData,
    exportData,
    importData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export { uid };
