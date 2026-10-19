import { jsxs as t, Fragment as g, jsx as e } from "react/jsx-runtime";
import { useAppApi as y, useChatLauncher as b } from "@kirocrew/app-sdk";
import { PageHeader as x, StatCard as d, Card as r, CardTitle as i, Btn as w } from "@kirocrew/app-sdk/ui";
import { useState as l, useEffect as S } from "react";
const j = "Use the dup-triage skill on the open issues of KiroCrewCaptain/ato-2026-dup-triage (or data/issues.json if GitHub is unreachable). Write dup-triage-report.md. Post nothing.";
function P() {
  const u = y(), { openChat: c } = b(), [n, h] = l(null), [a, p] = l("");
  S(() => {
    u.get("/api/crons").then((s) => {
      const m = (s.jobs || []).find((f) => f.name.endsWith("dup-triage-daily"));
      h(m || null);
    }).catch((s) => p(String(s)));
  }, []);
  const o = a ? "unknown" : n ? n.enabled ? "on" : "paused" : "not registered";
  return /* @__PURE__ */ t(g, { children: [
    /* @__PURE__ */ e(x, { title: "Dup Detective", subtitle: "Finds duplicate issues and explains every match. Drafts only." }),
    /* @__PURE__ */ t("div", { className: "px-6 pb-8 overflow-y-auto flex-1 min-h-0", children: [
      /* @__PURE__ */ t("div", { className: "grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] mb-6", children: [
        /* @__PURE__ */ e(d, { label: "Schedule", value: o, accent: o === "on" }),
        /* @__PURE__ */ e(d, { label: "Writes to GitHub", value: "none without your yes" })
      ] }),
      /* @__PURE__ */ t(r, { children: [
        /* @__PURE__ */ e(i, { children: "Run it now" }),
        /* @__PURE__ */ e("p", { className: "text-sm text-muted mb-3", children: "Opens a new chat with the dup-triage agent. Set Project to your clone, then paste this prompt if the box is empty and press send:" }),
        /* @__PURE__ */ e("pre", { className: "text-xs mb-3 whitespace-pre-wrap select-all", children: j }),
        /* @__PURE__ */ e(w, { onClick: () => c({ agent: "dup-triage", message: j, autoSend: !1 }), children: "Draft a run in chat" })
      ] }),
      /* @__PURE__ */ t(r, { children: [
        /* @__PURE__ */ e(i, { children: "Schedule" }),
        /* @__PURE__ */ e("p", { className: "text-sm text-muted", children: n ? `${n.schedule}. Ships paused: resume it on the Schedule page when you want it.` : a ? `Could not read the schedule: ${a}` : "No dup-triage-daily job found. Is the app enabled?" })
      ] }),
      /* @__PURE__ */ t(r, { children: [
        /* @__PURE__ */ e(i, { children: "The boundary" }),
        /* @__PURE__ */ t("ul", { className: "text-sm text-muted list-disc pl-5", children: [
          /* @__PURE__ */ e("li", { children: "Reads issues from KiroCrewCaptain/ato-2026-dup-triage or data/issues.json." }),
          /* @__PURE__ */ e("li", { children: "Writes only dup-triage-report.md and dup-triage-verdicts.json on your machine." }),
          /* @__PURE__ */ e("li", { children: "Never posts on a schedule." }),
          /* @__PURE__ */ e("li", { children: "Posts one comment, only on your own fork, only after you say yes in chat." })
        ] })
      ] })
    ] })
  ] });
}
export {
  P as default
};
