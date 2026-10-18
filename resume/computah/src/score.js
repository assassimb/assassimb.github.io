// Scores a parsed listing: how fast it is, what its parts are worth, whether to buy it,
// and how far down the price could reasonably be negotiated.
import { partValues } from "./value.js";

// References for "1.0": an RTX 4060 and a Ryzen 5 7600, today's mainstream 1080p build.
const GPU_REF = 19482, CPU_REF = 27000;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

export function performance(specs) {
  const g = specs.gpu?.score ? specs.gpu.score / GPU_REF : null;
  const c = specs.cpu?.score ? specs.cpu.score / CPU_REF : null;
  if (g == null && c == null) return null;
  const index = 0.7 * Math.min(g ?? 0.25, 1.6) + 0.3 * Math.min(c ?? 0.4, 1.6);
  const tier =
    index < 0.4 ? "Bureautique, vieux jeux" :
    index < 0.7 ? "1080p, réglages moyens" :
    index < 1.05 ? "1080p, réglages élevés" :
    index < 1.4 ? "1440p" : "1440p élevé, 4K";
  return {
    index, tier,
    score: Math.round(clamp(index * 70, 0, 100)),
    gpu: g, cpu: c,
    bottleneck: g != null && c != null && c < g * 0.45,
  };
}

// Overrides: { cpu: 120, ... } replaces the estimate for that part.
export function evaluate(specs, overrides = {}, price = specs.price) {
  const parts = partValues(specs).map(p => (overrides[p.key] != null ? { ...p, value: overrides[p.key], overridden: true } : p));
  const value = parts.reduce((s, p) => s + (p.value || 0), 0);
  const perf = performance(specs);
  const missing = parts.filter(p => p.value == null && p.key !== "storage").map(p => p.key);

  const notes = [];
  let penalty = 0;
  if (!specs.cpu?.score) { penalty += 8; notes.push("Processeur non précisé : demande le modèle exact."); }
  if (!specs.gpu?.score) { penalty += 12; notes.push("Carte graphique non précisée : demande le modèle exact."); }
  const ssd = (specs.storage || []).filter(d => d.type === "ssd").reduce((s, d) => s + d.gb, 0);
  if ((specs.storage || []).length && !ssd) { penalty += 8; notes.push("Pas de SSD : le démarrage et les jeux seront lents."); }
  else if (ssd && ssd < 480) { penalty += 3; notes.push(`SSD de ${ssd} Go : petit pour des jeux récents.`); }
  if (specs.ram?.gb && specs.ram.gb < 16) { penalty += 5; notes.push(`${specs.ram.gb} Go de RAM : 16 Go est le minimum pour jouer.`); }
  if (perf?.bottleneck) notes.push("Le processeur va freiner la carte graphique dans les jeux récents.");
  if (specs.flags?.oem) notes.push("PC de marque : carte mère et bloc d'alimentation souvent propriétaires.");
  if (specs.flags?.laptop) notes.push("Ça ressemble à un portable : l'analyse vise les PC de bureau.");
  if (specs.flags?.notPc) notes.push("Ça ressemble à une pièce ou un accessoire, pas à un PC complet.");
  if (specs.flags?.parts) notes.push("Vendu pour pièces ou avec un défaut : ne marche pas tel quel.");

  // Without the exact CPU and GPU there is nothing solid to price, so no verdict rather than a wrong one.
  // Prices under 20 $ are placeholders ("1 $", "0 $"), not real asks.
  const usable = price >= 20 && specs.cpu?.score && specs.gpu?.score && !specs.flags?.trade && !specs.flags?.notPc && !specs.flags?.laptop;
  const ratio = usable ? value / price : null;
  // Asking prices run ~10 % above what PCs actually sell for, so 0.9 counts as a fair price.
  // Past 1.2 the gains flatten, so deeper discounts on an already cheap PC still move the score.
  const valueScore = ratio == null ? null
    : clamp(ratio <= 1.2 ? 50 + (ratio - 0.9) * 110 : 83 + (ratio - 1.2) * 40, 0, 100);
  let buy = valueScore == null ? null
    : Math.round(clamp(0.7 * valueScore + 0.3 * (perf?.score ?? 30) - penalty, 0, 100));
  if (buy != null && specs.flags?.parts) buy = Math.min(buy, 40); // a broken PC is never a plain "buy"

  const v = specs.flags?.notPc ? { key: "unknown", label: "Pas un PC complet" }
    : specs.flags?.laptop ? { key: "unknown", label: "Portable : pas analysé" }
    : buy == null && !(price >= 20) ? { key: "unknown", label: "Pas de prix" } : verdict(buy);
  return { parts, value, ratio, valueScore, perf, buy, verdict: v, notes, missing, price };
}

export function verdict(buy) {
  if (buy == null) return { key: "unknown", label: "Il manque des infos" };
  if (buy >= 75) return { key: "buy", label: "Achète" };
  if (buy >= 60) return { key: "good", label: "Bon prix" };
  if (buy >= 45) return { key: "nego", label: "Négocie" };
  return { key: "pass", label: "Passe ton tour" };
}

// Price cuts of 10, 15 and 20 %: what the score becomes, the offer to make,
// and how likely the seller is to accept (age, price drops and wording).
export function negotiation(specs, overrides = {}) {
  const base = evaluate(specs, overrides);
  if (base.buy == null) return null;
  const steps = [0.1, 0.15, 0.2].map(cut => {
    const offer = Math.floor((specs.price * (1 - cut)) / 10) * 10;
    return { cut, offer, buy: evaluate(specs, overrides, offer).buy };
  });
  // Aim for the next verdict up: "Bon prix" for a so-so deal, "Achète" for a good one.
  const goal = base.buy >= 60 ? 75 : 60;
  const target = base.buy >= 75 ? null : steps.find(s => s.buy >= goal) || null;

  let odds = 45;
  if (specs.oldPrice) odds += 15;
  if (specs.ageDays >= 56) odds += 20; else if (specs.ageDays >= 28) odds += 10;
  if (base.ratio < 0.9) odds += 10;
  if (specs.flags?.open) odds += 20;
  if (specs.flags?.firm) odds -= 30;
  odds = clamp(odds, 5, 95);

  const pick = target || (base.buy >= 60 ? steps[0] : steps[2]);
  return {
    steps, target, odds,
    advice: base.buy >= 75 ? "Déjà un bon deal : une offre à -10 % reste raisonnable."
      : target ? `Vise ${target.offer} $ (-${Math.round(target.cut * 100)} %) : ça devient « ${verdict(target.buy).label} ».`
      : base.buy >= 60 ? "Déjà un bon prix : tente -10 %, sans plus."
      : "Même à -20 %, ça reste cher pour ce que c'est.",
    message: `Bonjour! Votre PC m'intéresse. Seriez-vous prêt à le laisser à ${pick.offer} $? Je peux passer le chercher rapidement.`,
  };
}
