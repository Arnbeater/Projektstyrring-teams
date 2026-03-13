const TC = ["#FF6B35", "#4B8BF5", "#34C77B", "#F5C542", "#A47BF5", "#35D0BA", "#F54B5E", "#FF8FA3", "#5EEAD4", "#FBBF24"];
const STS = ["Ikke startet", "I gang", "Til review", "Afsluttet"];
const SS = {
  "Ikke startet": { bg: "rgba(107,112,137,0.15)", c: "#6B7089", s: "Ny" },
  "I gang": { bg: "rgba(75,139,245,0.15)", c: "#4B8BF5", s: "Aktiv" },
  "Til review": { bg: "rgba(245,197,66,0.15)", c: "#F5C542", s: "Review" },
  "Afsluttet": { bg: "rgba(52,199,123,0.15)", c: "#34C77B", s: "✓" },
};
const PRI = ["Lav", "Normal", "Høj", "Kritisk"];
const PC = { Lav: "#6B7089", Normal: "#4B8BF5", Høj: "#FF6B35", Kritisk: "#F54B5E" };
const DK = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
const MK = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const GROUP_COLORS = [
  { name: "Rød", bg: "#FEE2E2", bar: "#F87171", border: "#FECACA", text: "#B91C1C" },
  { name: "Grøn", bg: "#DCFCE7", bar: "#86EFAC", border: "#BBF7D0", text: "#166534" },
  { name: "Blå", bg: "#DBEAFE", bar: "#93C5FD", border: "#BFDBFE", text: "#1E40AF" },
  { name: "Orange", bg: "#FFF7ED", bar: "#FDBA74", border: "#FED7AA", text: "#C2410C" },
  { name: "Lilla", bg: "#F3E8FF", bar: "#C4B5FD", border: "#DDD6FE", text: "#6D28D9" },
  { name: "Cyan", bg: "#ECFEFF", bar: "#67E8F9", border: "#A5F3FC", text: "#0E7490" },
  { name: "Pink", bg: "#FDF2F8", bar: "#F9A8D4", border: "#FBCFE8", text: "#BE185D" },
  { name: "Gul", bg: "#FEFCE8", bar: "#FDE047", border: "#FEF08A", text: "#A16207" },
];

export { TC, STS, SS, PRI, PC, DK, MK, GROUP_COLORS };
