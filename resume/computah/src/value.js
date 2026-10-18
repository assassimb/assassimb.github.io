// Used-market value of each part, in CAD, as of fall 2026 around Sherbrooke.
// These are estimates (calibrated against local asking prices, not sold prices):
// the UI shows them as such and lets the user override any of them.

// [benchmark score, used price]; linear in between, clamped at the ends.
const GPU_CURVE = [[3000, 30], [6400, 75], [8800, 100], [10000, 115], [12700, 160], [14700, 190],
  [15000, 220], [16700, 260], [19500, 340], [20600, 370], [22000, 410], [25000, 520],
  [27000, 640], [30000, 780], [34500, 1050], [38000, 1750]];
// CPU together with a matching motherboard: one is worthless without the other.
const CPU_CURVE = [[2000, 20], [4300, 40], [6500, 60], [9400, 95], [13000, 135], [17600, 175],
  [22000, 240], [27000, 320], [30000, 380], [34000, 450], [41000, 560], [60000, 780], [70000, 850]];

function curve(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return points[points.length - 1][1];
}

const round5 = n => Math.round(n / 5) * 5;
const RAM_PER_GB = { 3: 1, 4: 2.5, 5: 4.5 };

// Returns one line per part: { key, label, value, estimated: true } with value null when unknown.
export function partValues(specs) {
  const lines = [];
  const oem = specs.flags?.oem ? 0.85 : 1; // proprietary boards and PSUs resell for less

  lines.push({ key: "cpu", value: specs.cpu?.score ? round5(curve(CPU_CURVE, specs.cpu.score) * oem) : null });
  lines.push({ key: "gpu", value: specs.gpu?.score ? round5(curve(GPU_CURVE, specs.gpu.score)) : null });

  if (specs.ram?.gb) {
    const ddr = specs.ram.ddr || guessDdr(specs);
    lines.push({ key: "ram", value: round5(Math.max(10, specs.ram.gb * RAM_PER_GB[ddr])) });
  } else lines.push({ key: "ram", value: null });

  const disks = specs.storage || [];
  lines.push({
    key: "storage",
    value: disks.length
      ? round5(disks.reduce((sum, d) => sum + (d.type === "ssd" ? Math.max(15, d.gb * 0.045) : Math.max(8, d.gb * 0.015)), 0))
      : null,
  });

  const w = specs.psu?.watts;
  const psu = w ? (w < 450 ? 20 : w < 650 ? 35 : w < 850 ? 55 : 80) + (/gold|platinum|titanium/.test(specs.psu.rating || "") ? 15 : 0) : 35;
  lines.push({ key: "psu", value: round5(psu * oem), assumed: !w });
  lines.push({ key: "case", value: 40, assumed: true });
  // A working, assembled machine sells above its loose parts: build time, testing, Windows.
  const parts = lines.reduce((sum, l) => sum + (l.value || 0), 0);
  lines.push({ key: "build", value: round5(parts * 0.12 + (specs.flags?.windows ? 20 : 0)), assumed: true });
  return lines;
}

// Without a stated generation, the CPU platform is the best hint.
function guessDdr(specs) {
  const n = specs.cpu?.name || "";
  if (/Ryzen \d [789]\d{3}|Ultra/.test(n)) return 5;
  if (/i[3579]-[2-5]\d{3}\b|FX-|Xeon E[35]/.test(n)) return 3;
  return 4;
}
