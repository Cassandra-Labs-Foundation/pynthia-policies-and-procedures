// NCUA Form 5300 — the full form, as a downloadable PDF.
//
// Renders every subsection from the transcribed shell (lib/ncua5300Shell) with
// the same value rule the screen uses: a cell the core sources shows a live
// figure, a cell the user keyed shows that, and everything else is blank — never
// a fabricated zero. Single-amount sections render as Code · Account · Amount;
// wide matrices (delinquency, RBC risk weights) render each line's account codes
// compactly beneath its label, so every code is present without a 15-column
// table that no letter-size page could hold.
//
// This is NOT the government's fillable form (that PDF has no form fields at
// all) — it is our own faithful rendering, and it is a DRAFT working copy: NCUA
// accepts 5300s only through CUOnline. pdf-lib is imported on demand.
import {
  SCHEDULES, sectionsFor, subsectionStatus, STATE_META, FORM_EDITION,
  formReadiness, keyedCents,
} from './ncua5300Form';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
function money(cents) { return typeof cents === 'number' ? USD.format(cents / 100) : ''; }

function longDate(iso) {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
function quarterLabel(q) {
  const m = /^(\d{4})-Q(\d)$/.exec(q ?? '');
  return m ? `Q${m[2]} ${m[1]}` : (q ?? '');
}

// Standard-14 fonts are WinAnsi-only; normalise to a safe subset.
function ascii(s) {
  return String(s ?? '')
    .replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≈/g, '~').replace(/×/g, 'x')
    .replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/→/g, '->').replace(/…/g, '...').replace(/[•·]/g, '-').replace(/ /g, ' ')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

/**
 * Build the full-form PDF bytes. Pure (no browser globals) so it can be tested
 * outside a headless browser — the layout is where bugs hide.
 */
export async function buildFilingPdfBytes({
  period, instanceId, institution = 'Pynthia Banking',
  sourcedByCode = {}, keyed = {}, generatedAt = new Date(),
} = {}) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  doc.setTitle(`NCUA 5300 — ${quarterLabel(period?.quarter)} — ${institution}`);
  doc.setAuthor(institution);
  doc.setSubject('NCUA Form 5300 — full form (draft, partial)');
  doc.setCreator('Pynthia Banking · Call Report');

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const ink = rgb(0.106, 0.114, 0.137);
  const muted = rgb(0.42, 0.447, 0.502);
  const faint = rgb(0.61, 0.639, 0.686);
  const accent = rgb(0.31, 0.275, 0.898);
  const green = rgb(0.02, 0.5, 0.32);
  const hair = rgb(0.898, 0.906, 0.922);
  const band = rgb(0.965, 0.969, 0.98);
  const amberBg = rgb(1, 0.973, 0.914);
  const amberInk = rgb(0.573, 0.4, 0.05);

  const W = 612, H = 792, ML = 54, MR = 54, MT = 52, MB = 52;
  const RIGHT = W - MR, AMT_X = RIGHT, CODE_X = ML, LABEL_X = ML + 52;

  let page = doc.addPage([W, H]);
  const pages = [page];
  let y = H - MT;

  const widthOf = (s, f, size) => f.widthOfTextAtSize(ascii(s), size);
  const draw = (s, x, size, f, color) => page.drawText(ascii(s), { x, y, size, font: f, color });
  const drawAt = (s, x, yy, size, f, color) => page.drawText(ascii(s), { x, y: yy, size, font: f, color });
  const right = (s, xr, size, f, color) => page.drawText(ascii(s), { x: xr - widthOf(s, f, size), y, size, font: f, color });
  const line = (x1, x2, yy, color = hair, t = 0.75) => page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: t, color });
  const rect = (x, yy, w, h, color) => page.drawRectangle({ x, y: yy, width: w, height: h, color });
  const down = (dy) => { y -= dy; };
  const newPageIfNeeded = (need) => {
    if (y - need < MB) { page = doc.addPage([W, H]); pages.push(page); y = H - MT; return true; }
    return false;
  };
  const wrap = (s, f, size, maxW) => {
    const words = ascii(s).split(/\s+/);
    const out = []; let cur = '';
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > maxW && cur) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    return out;
  };

  const valueFor = (code) => {
    if (!code) return null;
    if (code in sourcedByCode) return { cents: sourcedByCode[code], live: true };
    const c = keyedCents(keyed[code]);
    return typeof c === 'number' ? { cents: c, live: false } : null;
  };

  const sharesSourcedCents = sourcedByCode['013'] ?? 0;
  const ctx = { sourcedByCode, keyed, sharesSourcedCents };

  // ── header ──────────────────────────────────────────────────────────────
  rect(0, H - 6, W, 6, accent);
  draw(institution, ML, 17, bold, ink);
  down(20);
  draw('NCUA Form 5300  ·  Call Report', ML, 10.5, font, muted);

  let my = H - MT;
  const metaRight = (labelStr, valStr, color = ink) => {
    const size = 9, gap = 6, vW = widthOf(valStr, bold, size);
    drawAt(valStr, RIGHT - vW, my, size, bold, color);
    drawAt(labelStr, RIGHT - vW - gap - widthOf(labelStr, font, size), my, size, font, faint);
    my -= 13;
  };
  metaRight('Reporting period', `${quarterLabel(period?.quarter)} · in progress`);
  metaRight('Period ends', longDate(period?.asOf));
  metaRight('Filing due', longDate(period?.dueAt));
  if (instanceId) metaRight('Instance', String(instanceId), muted);

  down(20);
  const chip = 'DRAFT · PARTIAL — NOT FOR SUBMISSION';
  const chipW = widthOf(chip, bold, 8.5) + 16;
  rect(ML, y - 3, chipW, 16, amberBg);
  drawAt(chip, ML + 8, y + 1, 8.5, bold, amberInk);
  down(22);
  line(ML, RIGHT, y, hair, 1);
  down(15);

  const fr = formReadiness(ctx);
  draw(
    `${FORM_EDITION}. ${fr.total} subsections · ${fr.applicable} apply to this credit union · `
    + `${fr.withData} with data · ${fr.notRequired} not required.`,
    ML, 9, font, muted,
  );
  down(12);
  for (const ln of wrap(
    'A cell the core sources shows a live figure; a cell the preparer keyed shows that; every other cell is blank — unknown, not zero.',
    font, 8.5, RIGHT - ML,
  )) { draw(ln, ML, 8.5, font, faint); down(11); }
  down(8);

  // ── per-subsection rendering ──────────────────────────────────────────────

  const toneColor = { good: green, info: accent, muted: faint };

  const subsectionHeader = (sched, first) => {
    const st = subsectionStatus(sched, ctx);
    if (!first) { newPageIfNeeded(70); down(6); } else { newPageIfNeeded(70); }
    const titleStr = (sched.letter ? `Schedule ${sched.letter} — ` : '') + sched.title;
    draw(titleStr, ML, 13, bold, ink);
    const meta = STATE_META[st.state] ?? STATE_META.empty;
    right(meta.label, RIGHT, 9, bold, toneColor[meta.tone] ?? muted);
    down(15);
    for (const ln of wrap(`When: ${sched.when}`, font, 8.5, RIGHT - ML)) { draw(ln, ML, 8.5, font, muted); down(11); }
    line(ML, RIGHT, y + 2, hair, 0.75);
    down(12);
  };

  const singleColLine = (ln) => {
    const code = (ln.codes || [])[0] || null;
    const isTotal = !!ln.total;
    const v = valueFor(code);
    newPageIfNeeded(isTotal ? 22 : 16);
    if (isTotal) { down(2); line(ML, RIGHT, y + 11, hair, 0.6); }
    if (code) draw(code, CODE_X, 8, mono, isTotal ? ink : faint);
    const indent = LABEL_X + (ln.level || 0) * 12;
    const labelFont = isTotal ? bold : font;
    let label = ln.label;
    const maxLabelW = AMT_X - indent - 92;
    if (widthOf(label, labelFont, 9.5) > maxLabelW) {
      while (label.length > 4 && widthOf(`${label}...`, labelFont, 9.5) > maxLabelW) label = label.slice(0, -1);
      label = `${label}...`;
    }
    draw(label, indent, 9.5, labelFont, isTotal ? ink : (code ? ink : muted));
    if (code) {
      if (v) right(money(v.cents), AMT_X, 9.5, isTotal ? bold : font, v.live ? green : ink);
      else right('—', AMT_X, 9.5, font, faint);
    }
    down(isTotal ? 16 : 14);
  };

  const multiColLine = (ln, columns) => {
    const isTotal = !!ln.total;
    newPageIfNeeded(24);
    const indent = LABEL_X - 40 + (ln.level || 0) * 12;
    draw(ln.label, indent, 9.5, isTotal ? bold : font, isTotal ? ink : ink);
    down(12);
    // Compact token line of every non-null code, with value if filled.
    const tokens = [];
    (ln.codes || []).forEach((code, i) => {
      if (!code) return;
      const v = valueFor(code);
      const col = columns[i] ? `${columns[i]}:` : '';
      tokens.push(v ? `${col}${code}=${money(v.cents)}` : `${col}${code}`);
    });
    if (tokens.length) {
      const tokenStr = tokens.join('   ');
      for (const lnw of wrap(tokenStr, mono, 7, RIGHT - (indent + 12))) {
        newPageIfNeeded(12);
        draw(lnw, indent + 12, 7, mono, faint);
        down(10);
      }
    }
    down(3);
  };

  SCHEDULES.forEach((sched, si) => {
    subsectionHeader(sched, si === 0);
    const sections = sectionsFor(sched.id);
    for (const sec of sections) {
      const columns = sec.columns && sec.columns.length ? sec.columns : ['Amount'];
      const multi = columns.length > 1;
      newPageIfNeeded(30);
      // section title band
      rect(ML, y - 5, RIGHT - ML, 16, band);
      const secLabel = (sec.n != null ? `§${sec.n}  ` : '') + sec.title;
      drawAt(secLabel, ML + 6, y, 8.5, bold, ink);
      down(20);
      if (!multi) {
        draw('CODE', CODE_X, 6.5, bold, faint);
        draw('ACCOUNT', LABEL_X, 6.5, bold, faint);
        right(columns[0] || 'AMOUNT', AMT_X, 6.5, bold, faint);
        down(10);
      }
      for (const ln of sec.lines) {
        if (multi) multiColLine(ln, columns);
        else singleColLine(ln);
      }
      down(6);
    }
  });

  // ── footers ───────────────────────────────────────────────────────────────
  const stampedAt = generatedAt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: ML, y: MB - 8 }, end: { x: RIGHT, y: MB - 8 }, thickness: 0.75, color: hair });
    p.drawText(ascii(`${institution} · Call Report · Generated ${stampedAt} · Draft — not for NCUA submission`), { x: ML, y: MB - 20, size: 7.5, font, color: faint });
    const pageStr = `Page ${i + 1} of ${pages.length}`;
    p.drawText(ascii(pageStr), { x: RIGHT - font.widthOfTextAtSize(pageStr, 7.5), y: MB - 20, size: 7.5, font, color: faint });
  });

  return doc.save();
}

/** Build the PDF and hand the browser a download. */
export async function downloadFilingPdf(opts = {}) {
  const bytes = await buildFilingPdfBytes(opts);
  const { period, institution = 'Pynthia Banking' } = opts;
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NCUA-5300-${period?.quarter ?? 'draft'}-${institution.replace(/\s+/g, '-')}-draft.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
