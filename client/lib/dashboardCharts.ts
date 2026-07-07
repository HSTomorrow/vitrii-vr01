// Lightweight inline-SVG chart builders for the Dashboard screen — no external charting
// library (kept dependency-free), ported from the approved dashboard mockup. Each function
// renders directly into a container element and wires up its own hover tooltip.

const NS = "http://www.w3.org/2000/svg";

function el(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
}

function ensureTooltip(container: HTMLElement): HTMLDivElement {
  let tooltip = container.querySelector<HTMLDivElement>(".dash-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "dash-tooltip";
    Object.assign(tooltip.style, {
      position: "absolute",
      pointerEvents: "none",
      zIndex: "5",
      background: "#1a1a1a",
      color: "#fff",
      borderRadius: "8px",
      padding: "8px 10px",
      fontSize: "12px",
      lineHeight: "1.5",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      opacity: "0",
      transform: "translate(-50%, -110%)",
      transition: "opacity .1s",
      whiteSpace: "nowrap",
    });
    container.style.position = "relative";
    container.appendChild(tooltip);
  }
  return tooltip;
}

function showTooltip(tooltip: HTMLDivElement, x: number, y: number, rows: { label: string; value: string; color?: string }[]) {
  tooltip.innerHTML = "";
  rows.forEach((row) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "6px";
    if (row.color) {
      const key = document.createElement("span");
      key.style.width = "10px";
      key.style.height = "2px";
      key.style.background = row.color;
      key.style.display = "inline-block";
      div.appendChild(key);
    }
    const label = document.createElement("span");
    label.textContent = row.label;
    const val = document.createElement("span");
    val.style.marginLeft = "auto";
    val.style.paddingLeft = "10px";
    val.style.fontWeight = "700";
    val.textContent = row.value;
    div.appendChild(label);
    div.appendChild(val);
    tooltip.appendChild(div);
  });
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
  tooltip.style.opacity = "1";
}

function hideTooltip(tooltip: HTMLDivElement) {
  tooltip.style.opacity = "0";
}

/** Round axis ticks to clean numbers — never a raw fractional step. */
function niceTicks(rawMax: number, targetCount: number): number[] {
  if (rawMax <= 0) return [0];
  const roughStep = rawMax / targetCount;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const norm = roughStep / mag;
  let niceNorm: number;
  if (norm <= 1) niceNorm = 1;
  else if (norm <= 2) niceNorm = 2;
  else if (norm <= 5) niceNorm = 5;
  else niceNorm = 10;
  const step = niceNorm * mag;
  const niceMax = Math.ceil(rawMax / step) * step;
  const ticks = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

export function renderLineChart(
  container: HTMLDivElement,
  labels: string[],
  series: LineSeries[],
  valueFmt: (n: number) => string,
) {
  const W = container.clientWidth || 480, H = 220;
  const padL = 54, padR = 16, padT = 16, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const allVals = series.flatMap((s) => s.values);
  const ticks = niceTicks(Math.max(1, ...allVals) * 1.1, 4);
  const maxV = ticks[ticks.length - 1] || 1;

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}`, role: "img" });

  ticks.forEach((v) => {
    const y = padT + plotH - (v / maxV) * plotH;
    svg.appendChild(el("line", { x1: padL, x2: W - padR, y1: y, y2: y, stroke: "#e7e6e1", "stroke-width": 1 }));
    const t = el("text", { x: padL - 8, y: y + 4, "text-anchor": "end", "font-size": 11, fill: "#898781" });
    t.textContent = valueFmt(v);
    svg.appendChild(t);
  });
  svg.appendChild(el("line", { x1: padL, x2: W - padR, y1: padT + plotH, y2: padT + plotH, stroke: "#cfcec7", "stroke-width": 1 }));

  labels.forEach((m, i) => {
    const x = padL + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2);
    const t = el("text", { x, y: H - 6, "text-anchor": "middle", "font-size": 11, fill: "#898781" });
    t.textContent = m;
    svg.appendChild(t);
  });

  const allPoints = series.map((s) =>
    s.values.map((v, i) => {
      const x = padL + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2);
      const y = padT + plotH - (v / maxV) * plotH;
      return [x, y] as const;
    }),
  );

  series.forEach((s, si) => {
    const pts = allPoints[si];
    const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    svg.appendChild(el("path", { d, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    pts.forEach((p) => {
      svg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 5, fill: "#fff" }));
      svg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 4, fill: s.color }));
    });
  });

  const crosshair = el("line", { x1: 0, x2: 0, y1: padT, y2: padT + plotH, stroke: "#cfcec7", "stroke-width": 1, opacity: 0 });
  svg.appendChild(crosshair);
  const hit = el("rect", { x: padL, y: padT, width: plotW, height: plotH, fill: "transparent" });
  svg.appendChild(hit);

  container.innerHTML = "";
  container.appendChild(svg);
  const tooltip = ensureTooltip(container);

  hit.addEventListener("pointermove", (e) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const idx = labels.length > 1 ? Math.round(((mx - padL) / plotW) * (labels.length - 1)) : 0;
    const clamped = Math.max(0, Math.min(labels.length - 1, idx));
    const x = padL + (labels.length > 1 ? (clamped / (labels.length - 1)) * plotW : plotW / 2);
    crosshair.setAttribute("x1", String(x));
    crosshair.setAttribute("x2", String(x));
    crosshair.setAttribute("opacity", "1");

    const wrapRect = container.getBoundingClientRect();
    const seriesRows = series.map((s) => ({ label: s.name, value: valueFmt(s.values[clamped]), color: s.color }));
    showTooltip(tooltip, e.clientX - wrapRect.left + 14, e.clientY - wrapRect.top - 12, [
      { label: labels[clamped], value: "" },
      ...seriesRows,
    ]);
  });
  hit.addEventListener("pointerleave", () => {
    crosshair.setAttribute("opacity", "0");
    hideTooltip(tooltip);
  });
}

export interface PieDatum {
  name: string;
  value: number;
  color: string;
}

export function renderPieChart(container: HTMLDivElement, data: PieDatum[], valueFmt: (n: number) => string) {
  const W = container.clientWidth || 420, H = 220;
  const cx = 108, cy = H / 2, r = 76;
  const total = data.reduce((a, d) => a + d.value, 0) || 1;

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}`, role: "img" });
  container.innerHTML = "";
  container.appendChild(svg);
  const tooltip = ensureTooltip(container);

  let angle = -Math.PI / 2;
  const gap = 0.018;
  const slices = data.map((d) => {
    const frac = d.value / total;
    const a0 = angle + gap / 2;
    const a1 = angle + frac * Math.PI * 2 - gap / 2;
    angle += frac * Math.PI * 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
    return { d, path, mid: (a0 + a1) / 2, frac };
  });

  slices.forEach((s) => {
    const p = el("path", { d: s.path, fill: s.d.color, stroke: "#fff", "stroke-width": 2 });
    (p as unknown as HTMLElement).style.cursor = "pointer";
    p.addEventListener("pointerenter", () => p.setAttribute("opacity", "0.85"));
    p.addEventListener("pointerleave", () => { p.setAttribute("opacity", "1"); hideTooltip(tooltip); });
    p.addEventListener("pointermove", (e: any) => {
      const wrapRect = container.getBoundingClientRect();
      showTooltip(tooltip, e.clientX - wrapRect.left + 14, e.clientY - wrapRect.top - 12, [
        { label: s.d.name, value: `${valueFmt(s.d.value)} · ${Math.round(s.frac * 100)}%`, color: s.d.color },
      ]);
    });
    svg.appendChild(p);
  });

  if (slices.length > 0) {
    const biggest = slices.reduce((a, b) => (b.frac > a.frac ? b : a), slices[0]);
    if (biggest.frac > 0) {
      const labelR = r * 0.62;
      const lx = cx + labelR * Math.cos(biggest.mid);
      const ly = cy + labelR * Math.sin(biggest.mid);
      const labelText = el("text", { x: lx, y: ly, "text-anchor": "middle", fill: "#fff", "font-size": 12, "font-weight": 700 });
      labelText.textContent = Math.round(biggest.frac * 100) + "%";
      svg.appendChild(labelText);
    }
  }

  const legendX = 216;
  data.forEach((d, i) => {
    const y = 26 + i * 24;
    svg.appendChild(el("rect", { x: legendX, y: y - 9, width: 10, height: 10, rx: 2, fill: d.color }));
    const nameT = el("text", { x: legendX + 16, y, "font-size": 12.5, fill: "#1a1a1a" });
    nameT.textContent = d.name;
    svg.appendChild(nameT);
    const valT = el("text", { x: W - 8, y, "text-anchor": "end", "font-size": 12.5, fill: "#555555" });
    valT.textContent = Math.round((d.value / total) * 100) + "%";
    svg.appendChild(valT);
  });
}

export function renderRankBars(
  container: HTMLDivElement,
  rows: { name: string; value: number }[],
  color: string,
  valueFmt: (n: number) => string,
) {
  const W = container.clientWidth || 420, rowH = 34, padL = 176, padR = 54, padT = 6;
  const sorted = rows.slice().sort((a, b) => b.value - a.value);
  const H = sorted.length * rowH + padT + 6;
  const plotW = W - padL - padR;
  const maxV = Math.max(1, ...sorted.map((r) => r.value)) * 1.15;

  const svg = el("svg", { width: "100%", height: H, viewBox: `0 0 ${W} ${H}`, role: "img" });
  container.innerHTML = "";
  container.appendChild(svg);
  const tooltip = ensureTooltip(container);

  sorted.forEach((r, i) => {
    const rowY = padT + i * rowH;
    const barH = 14;
    const y = rowY + (rowH - barH) / 2;
    const nameT = el("text", { x: 0, y: y + barH - 3, "font-size": 12.5, fill: "#1a1a1a" });
    nameT.textContent = r.name.length > 24 ? r.name.slice(0, 23) + "…" : r.name;
    svg.appendChild(nameT);

    const w = (r.value / maxV) * plotW;
    const bar = el("rect", { x: padL, y, width: Math.max(w, 3), height: barH, rx: 4, fill: color });
    (bar as unknown as HTMLElement).style.cursor = "pointer";
    bar.addEventListener("pointerenter", () => bar.setAttribute("opacity", "0.85"));
    bar.addEventListener("pointerleave", () => { bar.setAttribute("opacity", "1"); hideTooltip(tooltip); });
    bar.addEventListener("pointermove", (e: any) => {
      const wrapRect = container.getBoundingClientRect();
      showTooltip(tooltip, e.clientX - wrapRect.left + 14, e.clientY - wrapRect.top - 12, [
        { label: r.name, value: valueFmt(r.value), color },
      ]);
    });
    svg.appendChild(bar);
    const valT = el("text", { x: padL + w + 8, y: y + barH - 3, "font-size": 11.5, fill: "#898781" });
    valT.textContent = valueFmt(r.value);
    svg.appendChild(valT);
  });

  if (sorted.length === 0) {
    const t = el("text", { x: W / 2, y: H / 2, "text-anchor": "middle", "font-size": 12.5, fill: "#898781" });
    t.textContent = "Sem dados no período";
    svg.appendChild(t);
  }
}

export function fmtInt(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function fmtBRL(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1000) return (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "K";
  return fmtInt(n);
}
