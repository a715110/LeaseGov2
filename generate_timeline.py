import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import matplotlib.patheffects as pe
import matplotlib.dates as mdates
from datetime import datetime, timedelta
import numpy as np

# ── Data ──────────────────────────────────────────────────────────────────────

phases = [
    {
        "id": 1, "label": "Phase 1",
        "title": "Scaffolding &\nDesign System",
        "start": "2026-05-15", "end": "2026-05-16",
        "color": "#4F7CAC",
        "fcs": ["Design System", "AppShell", "ScreenGate"],
        "commits": 6,
    },
    {
        "id": 2, "label": "Phase 2",
        "title": "Document Intake\n& Extraction",
        "start": "2026-05-16", "end": "2026-05-22",
        "color": "#2E8B57",
        "fcs": ["FC-1 Pipeline", "FC-2 Extraction"],
        "commits": 14,
    },
    {
        "id": 3, "label": "Phase 3",
        "title": "Approvals\nCore",
        "start": "2026-05-22", "end": "2026-05-31",
        "color": "#8B5E3C",
        "fcs": ["FC-3 Approvals", "Rework Loop"],
        "commits": 11,
    },
    {
        "id": 4, "label": "Phase 4",
        "title": "Records &\nPackages/Export",
        "start": "2026-06-01", "end": "2026-06-10",
        "color": "#6A4C93",
        "fcs": ["FC-4 Records", "FC-5 Export"],
        "commits": 12,
    },
    {
        "id": 5, "label": "Phase 5",
        "title": "Reassessment\n& Audit",
        "start": "2026-06-10", "end": "2026-06-16",
        "color": "#C0392B",
        "fcs": ["FC-6 Reassessment", "FC-7 Audit"],
        "commits": 9,
    },
    {
        "id": 6, "label": "Phase 6",
        "title": "Admin &\nAgent Oversight",
        "start": "2026-06-16", "end": "2026-06-20",
        "color": "#D4A017",
        "fcs": ["FC-8 Admin", "FC-9 Agent"],
        "commits": 8,
    },
    {
        "id": 7, "label": "Phase 7",
        "title": "Event Bus\nHardening",
        "start": "2026-06-20", "end": "2026-07-21",
        "color": "#1A7A8A",
        "fcs": ["G-01/02/03 Fixes", "Route Fixes", "CF-01 Wiring", "StubPage"],
        "commits": 7,
    },
]

# Checkpoints — (date_str, sha, label, x_nudge_days, y_offset)
checkpoints = [
    ("2026-06-20", "3bf217f0", "Valid seed +\nApprover decline",   0,   -1.2),
    ("2026-06-22", "1a56f8d6", "G-01/02/03\nEvent bus handoff",   -1.5, -2.2),
    ("2026-06-22", "559e0d6b", "Route fixes +\nFC-6 stubs",        0,   -3.2),
    ("2026-06-22", "f79ef298", "RECORD_APPROVED +\nStub watermarks", 1.5, -2.2),
    ("2026-07-20", "1f424f99", "declineSource +\nMount-time fix",  0,   -1.2),
]

milestones = [
    ("2026-06-16", "Test Report\n(12 warnings,\n5 broken)"),
    ("2026-06-22", "Build-State\nReport v1"),
    ("2026-07-20", "Regrounding\nReport v2"),
]

# ── Figure setup ──────────────────────────────────────────────────────────────

BG = '#0F1923'
fig, ax = plt.subplots(figsize=(26, 12))
fig.patch.set_facecolor(BG)
ax.set_facecolor(BG)

date_min = datetime(2026, 5, 13)
date_max = datetime(2026, 7, 24)
ax.set_xlim(date_min, date_max)
ax.set_ylim(-5.8, 10.5)

ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
ax.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=0, interval=1))
ax.tick_params(axis='x', colors='#7A9BBB', labelsize=9, pad=10, length=4)
ax.tick_params(axis='y', left=False, labelleft=False)
for spine in ax.spines.values():
    spine.set_visible(False)

# Grid lines
for label in ax.get_xticklabels():
    x_pos = mdates.datestr2num(label.get_text() + " 2026") if label.get_text() else None
for x in ax.get_xticks():
    ax.axvline(x=x, color='#1A2D3F', linewidth=0.7, zorder=0)

# ── Timeline axis ─────────────────────────────────────────────────────────────

AXIS_Y = 3.0
ax.axhline(y=AXIS_Y, xmin=0.015, xmax=0.985, color='#2A4A6A', linewidth=2.5, zorder=1)

# ── Phase bars ────────────────────────────────────────────────────────────────

BAR_Y = 4.5
BAR_H = 2.0

for ph in phases:
    d0 = datetime.strptime(ph["start"], "%Y-%m-%d")
    d1 = datetime.strptime(ph["end"],   "%Y-%m-%d")
    x0 = mdates.date2num(d0)
    x1 = mdates.date2num(d1)
    w  = x1 - x0

    # Main bar
    bar = FancyBboxPatch(
        (x0 + 0.05, BAR_Y), w - 0.1, BAR_H,
        boxstyle="round,pad=0.25",
        facecolor=ph["color"], edgecolor='none', alpha=0.88, zorder=3
    )
    ax.add_patch(bar)

    cx = (x0 + x1) / 2

    # Phase label above bar
    ax.text(cx, BAR_Y + BAR_H + 0.18, ph["label"],
            ha='center', va='bottom', fontsize=8.5, fontweight='bold',
            color='#AABBCC', zorder=5)

    # Title inside bar
    ax.text(cx, BAR_Y + BAR_H * 0.58, ph["title"],
            ha='center', va='center', fontsize=9, fontweight='bold',
            color='white', zorder=5, linespacing=1.45)

    # Commit badge (top-right corner of bar)
    ax.text(x1 - 0.3, BAR_Y + BAR_H - 0.18, f"{ph['commits']}c",
            ha='right', va='top', fontsize=7.5, color='white',
            fontweight='bold', zorder=6,
            bbox=dict(boxstyle='round,pad=0.2', facecolor='#00000060', edgecolor='none'))

    # FC chips — single row below bar
    chip_y = BAR_Y - 0.52
    n = len(ph["fcs"])
    if n == 1:
        positions = [cx]
    else:
        positions = np.linspace(x0 + 0.8, x1 - 0.8, n)

    for fc, cpx in zip(ph["fcs"], positions):
        chip_w = max(len(fc) * 0.095 + 0.4, 1.4)
        chip = FancyBboxPatch(
            (cpx - chip_w / 2, chip_y - 0.2), chip_w, 0.4,
            boxstyle="round,pad=0.08",
            facecolor=ph["color"], edgecolor='none', alpha=0.45, zorder=4
        )
        ax.add_patch(chip)
        ax.text(cpx, chip_y, fc,
                ha='center', va='center', fontsize=6.8, color='#DDEEFF', zorder=5)

    # Connector to axis
    ax.plot([cx, cx], [BAR_Y - 0.05, AXIS_Y + 0.1],
            color=ph["color"], linewidth=1.0, alpha=0.45, zorder=2, linestyle=':')

# ── Milestones ────────────────────────────────────────────────────────────────

MS_Y = AXIS_Y + 0.6
for ms_date, ms_label in milestones:
    d = datetime.strptime(ms_date, "%Y-%m-%d")
    x = mdates.date2num(d)
    ax.plot(x, MS_Y, 'D', color='#FF6B6B', markersize=10, zorder=7,
            markeredgecolor=BG, markeredgewidth=1.8)
    ax.text(x, MS_Y + 0.32, ms_label,
            ha='center', va='bottom', fontsize=7, color='#FF9999',
            linespacing=1.35, zorder=7)

# ── Checkpoints ───────────────────────────────────────────────────────────────

for cp_date, sha, label, nudge_days, y_off in checkpoints:
    d = datetime.strptime(cp_date, "%Y-%m-%d") + timedelta(days=nudge_days)
    x = mdates.date2num(d)
    y_dot = AXIS_Y
    y_box = AXIS_Y + y_off

    # Dot on axis
    ax.plot(x, y_dot, 'o', color='#F0C040', markersize=9, zorder=8,
            markeredgecolor=BG, markeredgewidth=1.8)

    # Connector
    ax.plot([x, x], [y_dot - 0.12, y_box + 0.28],
            color='#F0C040', linewidth=0.9, alpha=0.65, linestyle='--', zorder=4)

    # Box
    box_w = 2.6
    box_h = 0.52
    box = FancyBboxPatch(
        (x - box_w / 2, y_box - box_h / 2), box_w, box_h,
        boxstyle="round,pad=0.12",
        facecolor='#1A2A18', edgecolor='#F0C040', linewidth=1.0, alpha=0.95, zorder=6
    )
    ax.add_patch(box)

    # SHA
    ax.text(x, y_box + 0.06, sha,
            ha='center', va='center', fontsize=7.5, color='#F0C040',
            fontweight='bold', fontfamily='monospace', zorder=7)

    # Label below box
    ax.text(x, y_box - box_h / 2 - 0.1, label,
            ha='center', va='top', fontsize=6.5, color='#AABBCC',
            linespacing=1.3, zorder=7)

# ── Axis section labels ───────────────────────────────────────────────────────

ax.text(mdates.date2num(date_min) + 0.3, BAR_Y + BAR_H / 2, 'PHASES',
        ha='left', va='center', fontsize=8, color='#5577AA',
        fontweight='bold', rotation=90, zorder=5)

ax.text(mdates.date2num(date_min) + 0.3, AXIS_Y - 2.5, 'CHECKPOINTS',
        ha='left', va='center', fontsize=8, color='#5577AA',
        fontweight='bold', rotation=90, zorder=5)

# ── Title ─────────────────────────────────────────────────────────────────────

ax.text(0.5, 1.0, 'LeaseGov — Chronological Build Timeline',
        transform=ax.transAxes, ha='center', va='top',
        fontsize=18, fontweight='bold', color='#E8F0F8',
        path_effects=[pe.withStroke(linewidth=4, foreground=BG)])

ax.text(0.5, 0.962, 'May 15 – July 20, 2026  ·  67 commits  ·  85 page files  ·  9 Feature Clusters  ·  9 Roles',
        transform=ax.transAxes, ha='center', va='top',
        fontsize=9.5, color='#5577AA')

# ── Legend ────────────────────────────────────────────────────────────────────

legend_items = [
    mpatches.Patch(facecolor='#4F7CAC', alpha=0.88, label='Phase bar (color = cluster)'),
    plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='#F0C040',
               markersize=9, label='Checkpoint (git SHA)'),
    plt.Line2D([0], [0], marker='D', color='w', markerfacecolor='#FF6B6B',
               markersize=8, label='Milestone / Report'),
]
leg = ax.legend(handles=legend_items, loc='lower right',
                framealpha=0.2, facecolor=BG, edgecolor='#2A4A6A',
                labelcolor='#AABBCC', fontsize=9, borderpad=0.8)

plt.tight_layout(rect=[0.02, 0.04, 1.0, 0.97])
plt.savefig('/home/ubuntu/leasegov/build_timeline.png', dpi=180,
            facecolor=BG, bbox_inches='tight')
print("Saved: build_timeline.png")
