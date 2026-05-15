# Vuln Data Collection Tool — Test Journey

Covers every scenario implemented in the Disposition / Blockers / Patch Window / RC Managing Team rollout. Today's reference date for examples: **Thursday 2026-05-14**.

## Setup
1. `npm run dev` → open `http://localhost:3000`
2. Wait for the AG Grid to populate (~50 rows)
3. Pick any row → it opens the side panel on the **Triage** tab. Keep this row open across journeys unless told otherwise.

---

## Journey 1 — Spec disposition: "Need Requested Patch Window"

1. Open the **Disposition** dropdown.
   - **Expected:** 9 spec values appear first, then a greyed `──────────` separator, then 5 legacy values (Fix, Defer, Mitigate, Accept Risk, False Positive). Total 14 items.
2. Select **"CIO ACTION – Need Requested Patch Window"**.
3. **Expected fields shown:** Requested Patch Window dropdown only. *No* Expected Remediation Date, *no* CRQ, *no* Blockers.
4. Open the **Requested Patch Window** dropdown.
   - **Expected:** ~24 slots, first is `Fri 5/15 16:00–23:59 ET`, then `Sat 5/16 00:00–08:00 ET` / `08:00–16:00 ET` / `16:00–23:59 ET`, then 3 × Sunday slots, then `Mon 5/18 00:00–08:00 ET`. Pattern repeats for weekends of 5/22 and 5/29.
5. Leave the dropdown blank and click **Save**.
   - **Expected:** Inline error "Requested Patch Window is required" under the dropdown. Save is blocked.
6. Pick a slot → click **Save**.
   - **Expected:** Save succeeds, panel marks dirty as clean, no errors.
7. Switch to the **Activity** tab.
   - **Expected:** New entry `changed Disposition from "…" to "CIO ACTION – Need Requested Patch Window"` and a separate entry for `Requested Patch Window`.

---

## Journey 2 — Spec disposition: "App Team will Remediate"

1. Set **Disposition** = "CIO ACTION – App Team will Remediate".
2. **Expected fields shown:** Expected Remediation Date **+** CRQ #. *No* Patch Window, *no* Blockers.
3. Leave both empty → **Save**.
   - **Expected:** Two inline errors: "Expected Remediation Date is required" and "CRQ is required". Save blocked.
4. Fill Expected Remediation Date only → **Save**.
   - **Expected:** Only "CRQ is required" remains. Save still blocked.
5. Enter `CRQ000002099999` → **Save**.
   - **Expected:** Save succeeds. The follow-on **"Remediation complete and pending clear scan?"** radio appears after save (since CRQ is now non-empty).
6. Select **Yes** for "pending clear scan?" → Health Check Time input appears.
7. Fill a datetime → Health Check Complete radio appears.

---

## Journey 3 — Spec disposition: "App Team identify blocker" + Other free-text

1. Set **Disposition** = "CIO ACTION – App Team identify blocker".
2. **Expected fields shown:** Identified Blockers multi-select only. *No* Patch Window, *no* CRQ, *no* Expected Remediation Date.
3. Click Save with no blockers selected.
   - **Expected:** Inline error "At least one blocker must be selected".
4. Open the Blockers popover.
   - **Expected:** 11 options ending with **"Other (please provide detail)"**.
5. Tick **"Other (please provide detail)"** → close popover.
   - **Expected:** The "Other blocker detail" textarea appears below the chip row.
6. Click Save with the textarea empty.
   - **Expected:** Inline error "Please provide detail for Other".
7. Type any text → Save → succeeds. Confirm audit log has both `Identified Blockers` and `Other Blocker Detail` entries.

---

## Journey 4 — Spec disposition: "Request Self-Service Package"

1. Set **Disposition** = "CIO ACTION – Request Self-Service Package (Not Automatically Pushed by PCC)".
2. **Expected fields shown:** Expected Remediation Date **+** CRQ # (same as Journey 2).
3. Same validation rules as Journey 2 apply.

---

## Journey 5 — Dispositions with NO conditional fields

For each value below, set the disposition and confirm **no** conditional fields render (only the always-on RC Managing Team, Owner, and CTI Remediation):

- "CIO INFORM – LLE force patch on Midweek at 10PM ET for AMRS (APAC 10AM ET, EMEA 8PM ET)"
- "CIO REVIEW – PCC will patch under established RMW"
- "NO IMMEDIATE ACTION – No Patch Available, waiting for patch"
- "NO IMMEDIATE ACTION – CTI AIT"
- "TEAM 1 ACTION – Baseline ESM-OS Remediation Team"

For each: change disposition → click **Save** → expect success with no errors.

---

## Journey 6 — RC Managing Team (always shown)

1. Pick any disposition.
2. **Expected:** RC Managing Team `<Input>` sits just below the Disposition dropdown. Pre-populated with one of "Linux Patch Ops" / "Windows Endpoint" / "Cloud Infra" / "App Security" / "Network Ops" (rotated by row index).
3. Type "Mainframe Ops" → Save → Activity tab shows `changed RC Managing Team from "Linux Patch Ops" to "Mainframe Ops"`.
4. Switch disposition through all 14 values — the RC Managing Team field remains visible on every one.

---

## Journey 7 — Legacy disposition regression

Confirm the original UX still works for old data:

1. Set **Disposition** = "Fix".
   - **Expected:** Patch Window + Expected Remediation Date both visible (same as Mitigate). No required-field stars on Patch Window for legacy.
2. Set **Disposition** = "Defer".
   - **Expected:** Blockers multi-select + Justification textarea + Re-evaluate-by date. Empty justification blocks Save with the existing red-text error.
3. Set **Disposition** = "Accept Risk" → same as Defer.
4. Set **Disposition** = "False Positive".
   - **Expected:** "False positive reason" textarea appears, nothing else conditional.

---

## Journey 8 — Bulk-action menu grouping

1. Tick the header checkbox or select 3–4 rows in the grid.
   - **Expected:** Dark BulkActionBar slides up at the bottom.
2. Click **Set Disposition**.
   - **Expected:** Popover lists 9 spec values, then a `──────────` separator, then 5 legacy values. Width is wide enough to read full labels (no truncation of "CIO INFORM – LLE force patch…").
3. Pick "CIO REVIEW – PCC will patch under established RMW".
   - **Expected:** All selected rows update their Disposition column. Popover closes.

---

## Journey 9 — Right-click context menu

1. Right-click any row in the grid → hover **Set Disposition**.
   - **Expected:** Submenu lists the same 14 values + separator as the bulk-action popover.
2. Pick any spec value → that row's Disposition column updates.

---

## Journey 10 — Patch-window freshness (regression on date math)

Optional automated sanity check via the dev console (or a unit test if you add one):

```js
// In the browser dev tools after the form is mounted
import("/lib/patch-windows.js").then(m =>
  console.table(m.getPatchWindows(new Date(2026, 4, 14))) // May 14 2026
);
```

**Expected first 8 rows:**
```
Fri 5/15 16:00–23:59 ET
Sat 5/16 00:00–08:00 ET
Sat 5/16 08:00–16:00 ET
Sat 5/16 16:00–23:59 ET
Sun 5/17 00:00–08:00 ET
Sun 5/17 08:00–16:00 ET
Sun 5/17 16:00–23:59 ET
Mon 5/18 00:00–08:00 ET
```

If today is already Friday, the **first** slot should be today's Friday, not next week's.

---

## Journey 11 — Cross-field audit log capture

1. Open a row, change in one go: Disposition, RC Managing Team, CRQ, Expected Remediation Date.
2. Click **Save** → switch to **Activity**.
   - **Expected:** **One entry per changed field** (4 entries), each with the user-facing label, old value, new value, timestamp. Not a single merged "save" entry.

---

## Pass/fail summary

| # | Journey | Pass | Notes |
|---|---|---|---|
| 1 | Need Requested Patch Window | | |
| 2 | App Team will Remediate | | |
| 3 | App Team identify blocker + Other | | |
| 4 | Request Self-Service Package | | |
| 5 | Five no-conditional dispositions | | |
| 6 | RC Managing Team always visible | | |
| 7 | Legacy disposition regression | | |
| 8 | Bulk-action menu grouping | | |
| 9 | Right-click context menu | | |
| 10 | Patch-window date math | | |
| 11 | Audit log per-field entries | | |
