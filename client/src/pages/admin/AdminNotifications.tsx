/**
 * AdminNotifications — FC-8 Screen 8.6
 * Screen key: admin-notifications
 * Route: /admin/notifications
 *
 * Prompt 8.6: Appearance settings screen.
 * SECTION 1 "Design Theme": 4 theme cards in 2×2 grid.
 *   Structured Authority · Modern Violet · Gradient Pro · Executive Slate
 *   Each card: theme name · accent color swatch · mini sidebar preview
 *   Selected: checkmark ring in accent color
 * SECTION 2 "Color Mode": segmented control (Light/Dark/System) +
 *   allow_user_mode_toggle switch
 * SECTION 3 "Branding" (Professional/Enterprise only): logo upload ·
 *   org display name · accent color picker · Preview Branding button
 * SECTION 4 "Notification Preferences": 7 category rows with
 *   In-App and Email toggles
 * Saved to TenantConfiguration (creates new version)
 *
 * Data model refs: TenantConfiguration, UserPreference (Part 2.1)
 */

import { useState, useContext } from "react";
import { Check, Upload, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SCREEN_KEYS } from "@/constants/screenKeys";
import AdminLayout from "@/components/admin/AdminLayout";
import { LeaseGovThemeContext } from "@/contexts/LeaseGovThemeContext";
import type { ThemeKey, ColorMode } from "@/types/shared/ThemeMode";

type DesignTheme = ThemeKey;
type NotifPref = "email" | "in_app" | "both" | "off";

interface ThemeCard {
  id: DesignTheme;
  name: string;
  accent: string;
  sidebar: string;
  surface: string;
}

const THEMES: ThemeCard[] = [
  { id:"structured_authority", name:"Structured Authority", accent:"#2563EB", sidebar:"#0F172A", surface:"#F8FAFC" },
  { id:"modern_violet",        name:"Modern Violet",        accent:"#7C3AED", sidebar:"#1E1B4B", surface:"#FAFAFA" },
  { id:"gradient_pro",         name:"Gradient Pro",         accent:"#0EA5E9", sidebar:"#0C4A6E", surface:"#F0F9FF" },
  { id:"executive_slate",      name:"Executive Slate",      accent:"#475569", sidebar:"#1E293B", surface:"#F1F5F9" },
];

const NOTIF_CATEGORIES = [
  "Assignment notifications",
  "Approval notifications",
  "Rejection notifications",
  "Overdue item alerts",
  "Approaching date alerts",
  "Agent checkpoint alerts",
  "Watchlist review reminders",
];

export default function AdminNotifications() {
  const _screenKey = SCREEN_KEYS.ADMIN_NOTIFICATIONS;
  const [dirty, setDirty] = useState(false);
  const [allowToggle, setAllowToggle] = useState(true);
  const [orgName, setOrgName] = useState("Acme Corporation");
  const [accentColor, setAccentColor] = useState("#2563EB");
  const [notifPrefs, setNotifPrefs] = useState<Record<string, NotifPref>>(
    Object.fromEntries(NOTIF_CATEGORIES.map(c => [c, "both"]))
  );

  // Read theme + mode from global context so this page stays in sync with the header picker
  const themeCtx = useContext(LeaseGovThemeContext)
  const selectedTheme: DesignTheme = themeCtx?.themeKey ?? "structured_authority"
  const colorMode: ColorMode = themeCtx?.rawMode ?? "light"
  function setSelectedTheme(id: DesignTheme) {
    themeCtx?.setThemeKey(id)
    setDirty(true)
  }
  function setColorMode(m: ColorMode) {
    themeCtx?.setMode(m)
    setDirty(true)
  }
  const [previewOpen, setPreviewOpen] = useState(false);

  // Starter tier mock — branding locked
  const subscriptionTier: string = "professional";
  const brandingEnabled = subscriptionTier !== "starter";

  function setNotif(cat: string, val: NotifPref) {
    setNotifPrefs(p => ({ ...p, [cat]: val }));
    setDirty(true);
  }

  // TODO: Backend integration required — POST /api/admin/config/tenant (creates new version)
  function saveChanges() { setDirty(false); }

  const selectedThemeCard = THEMES.find(t => t.id === selectedTheme)!;

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full bg-[var(--color-lg-page-bg)]">
        <div className="page-header">
          <div>
            <h1 className="page-title">Appearance &amp; Notifications</h1>
            <p className="page-subtitle">Changes create a new TenantConfiguration version — previous versions can be restored</p>
          </div>
          <Button className="h-8 text-[12px] gap-1.5" disabled={!dirty} onClick={saveChanges}>
            <Save className="w-3.5 h-3.5" /> Save Changes
          </Button>
        </div>

        <div className="px-6 pb-8 flex flex-col gap-6 max-w-3xl">

          {/* SECTION 1: Design Theme */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-[14px] font-bold text-foreground mb-4">Design Theme</h2>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(theme => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => { setSelectedTheme(theme.id); setDirty(true); }}
                    className="relative p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: isSelected ? theme.accent : "var(--color-border)",
                      background: isSelected ? `${theme.accent}08` : "transparent",
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: theme.accent }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {/* Mini preview */}
                    <div className="flex gap-1.5 mb-3 h-10 rounded overflow-hidden border border-border/50">
                      <div className="w-8 rounded-l" style={{ background: theme.sidebar }} />
                      <div className="flex-1 rounded-r flex flex-col gap-1 p-1.5" style={{ background: theme.surface }}>
                        <div className="h-1.5 rounded-full w-3/4" style={{ background: theme.accent, opacity:0.7 }} />
                        <div className="h-1 rounded-full w-1/2 bg-gray-200" />
                        <div className="h-1 rounded-full w-2/3 bg-gray-200" />
                      </div>
                    </div>
                    <p className="text-[12px] font-semibold text-foreground">{theme.name}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      <div className="w-4 h-4 rounded-full border border-border/50" style={{ background: theme.accent }} title="Accent" />
                      <div className="w-4 h-4 rounded-full border border-border/50" style={{ background: theme.sidebar }} title="Sidebar" />
                      <div className="w-4 h-4 rounded-full border border-border/50" style={{ background: theme.surface }} title="Surface" />
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              <a href="#" className="underline" style={{ color:"var(--color-lg-primary)" }}>Request custom theme</a>
              {" "}— available on Enterprise plans
            </p>
          </section>

          {/* SECTION 2: Color Mode */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-[14px] font-bold text-foreground mb-4">Color Mode</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-semibold text-foreground w-52">Default mode for this organization</span>
                <div className="flex gap-1">
                  {(["light","dark"] as ColorMode[]).map(m => (
                    <button key={m} onClick={() => { setColorMode(m); setDirty(true); }}
                      className="px-3 py-1.5 rounded text-[11px] font-semibold border capitalize transition-all"
                      style={{
                        borderColor: colorMode === m ? selectedThemeCard.accent : "var(--color-border)",
                        background: colorMode === m ? selectedThemeCard.accent : "transparent",
                        color: colorMode === m ? "white" : "var(--color-muted-foreground)",
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-52">
                  <p className="text-[12px] font-semibold text-foreground">Allow individual users to change color mode</p>
                  {!allowToggle && <p className="text-[11px] text-muted-foreground mt-0.5">Users cannot override this setting</p>}
                </div>
                <Switch checked={allowToggle} onCheckedChange={v => { setAllowToggle(v); setDirty(true); }} />
              </div>
              {allowToggle && (
                <p className="text-[11px] text-muted-foreground">Users set their preference in their profile.</p>
              )}
            </div>
          </section>

          {/* SECTION 3: Branding */}
          <section className={`bg-card border border-border rounded-xl p-6 ${!brandingEnabled ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold text-foreground">Branding</h2>
              {!brandingEnabled && (
                <span className="text-[11px] px-2 py-1 rounded bg-muted/30 text-muted-foreground font-semibold">
                  Available on Professional and Enterprise plans
                </span>
              )}
            </div>
            <div className={`flex flex-col gap-4 ${!brandingEnabled ? "pointer-events-none" : ""}`}>
              {/* Logo upload */}
              <div>
                <p className="text-[12px] font-semibold text-foreground mb-1.5">Organization Logo</p>
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-[var(--color-lg-primary)] transition-colors cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <p className="text-[12px]">Drag &amp; drop logo or <span className="underline" style={{ color:"var(--color-lg-primary)" }}>browse</span></p>
                  <p className="text-[11px]">PNG or SVG, max 2 MB</p>
                </div>
              </div>
              {/* Org display name */}
              <div>
                <p className="text-[12px] font-semibold text-foreground mb-1.5">Organization Display Name</p>
                <Input className="h-8 text-[12px] max-w-xs" value={orgName} onChange={e => { setOrgName(e.target.value); setDirty(true); }} />
              </div>
              {/* Accent color */}
              <div>
                <p className="text-[12px] font-semibold text-foreground mb-0.5">Brand Accent Color</p>
                <p className="text-[11px] text-muted-foreground mb-1.5">Overrides theme accent only — not full palette</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={e => { setAccentColor(e.target.value); setDirty(true); }}
                    className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input className="h-8 text-[12px] w-28 font-mono" value={accentColor}
                    onChange={e => { setAccentColor(e.target.value); setDirty(true); }} />
                  <Button variant="outline" className="h-8 text-[12px] gap-1.5" onClick={() => setPreviewOpen(!previewOpen)}>
                    <Eye className="w-3.5 h-3.5" /> Preview Branding
                  </Button>
                </div>
              </div>
              {/* Preview panel */}
              {previewOpen && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="flex h-24">
                    <div className="w-16 flex flex-col gap-1.5 p-2" style={{ background: selectedThemeCard.sidebar }}>
                      <div className="h-2 rounded-full" style={{ background: accentColor, opacity:0.9 }} />
                      <div className="h-1.5 rounded-full bg-white/20" />
                      <div className="h-1.5 rounded-full bg-white/20" />
                      <div className="h-1.5 rounded-full bg-white/20" />
                    </div>
                    <div className="flex-1 p-3" style={{ background: selectedThemeCard.surface }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-16 h-3 rounded" style={{ background: accentColor }} />
                        <span className="text-[9px] text-gray-500">{orgName}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 mb-1 w-3/4" />
                      <div className="h-1.5 rounded-full bg-gray-200 w-1/2" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center py-1.5 border-t border-border">Mini preview with custom accent applied</p>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: Notification Preferences */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="mb-1">
              <h2 className="text-[14px] font-bold text-foreground">Notification Preferences</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Saved to your user preferences — not tenant-wide</p>
            </div>
            <div className="flex flex-col gap-0">
              {NOTIF_CATEGORIES.map(cat => (
                <div key={cat} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <span className="text-[12px] font-medium text-foreground flex-1">{cat}</span>
                  <div className="flex gap-1">
                    {(["email","in_app","both","off"] as NotifPref[]).map(v => (
                      <button key={v} onClick={() => setNotif(cat, v)}
                        className="px-2 py-1 rounded text-[10px] font-semibold border capitalize transition-all"
                        style={{
                          borderColor: notifPrefs[cat] === v ? "var(--color-lg-primary)" : "var(--color-border)",
                          background: notifPrefs[cat] === v ? "var(--color-lg-primary)" : "transparent",
                          color: notifPrefs[cat] === v ? "white" : "var(--color-muted-foreground)",
                        }}>
                        {v.replace("_","-")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
