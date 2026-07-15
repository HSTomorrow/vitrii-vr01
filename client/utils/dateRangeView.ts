export type CompromissosView = "dia" | "semana" | "mes";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Week starts on Sunday, matching Date#getDay()'s 0=Sunday convention used elsewhere in this app.
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return endOfDay(d);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getRangeForView(
  view: CompromissosView,
  anchor: Date,
): { from: Date; to: Date } {
  if (view === "dia") return { from: startOfDay(anchor), to: endOfDay(anchor) };
  if (view === "semana") return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
  return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
}

export function shiftAnchor(
  view: CompromissosView,
  anchor: Date,
  direction: 1 | -1,
): Date {
  const d = new Date(anchor);
  if (view === "dia") d.setDate(d.getDate() + direction);
  else if (view === "semana") d.setDate(d.getDate() + direction * 7);
  else d.setMonth(d.getMonth() + direction);
  return d;
}
