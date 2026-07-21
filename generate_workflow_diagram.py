"""
LeaseGov — Core Workflow Diagram (v2)
Swimlane diagram with even column spacing and clean rework loops.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

FIG_W, FIG_H = 32, 20
fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
ax.set_xlim(0, FIG_W)
ax.set_ylim(0, FIG_H)
ax.axis('off')
fig.patch.set_facecolor('#0d1117')
ax.set_facecolor('#0d1117')

# ── Colors ─────────────────────────────────────────────────────────────────
C = {
    'doc_sub':   '#475569',
    'preparer':  '#1d4ed8',
    'system':    '#0e7490',
    'reviewer':  '#6d28d9',
    'approver':  '#b45309',
    'accountant':'#047857',
    'reassess':  '#9f1239',
    'bg':        '#0d1117',
    'lane_a':    '#111827',
    'lane_b':    '#0d1117',
    'border':    '#1e2d3d',
    'text_h':    '#f1f5f9',
    'text_s':    '#64748b',
    'text_m':    '#94a3b8',
    'arr_norm':  '#334155',
    'arr_rew':   '#ef4444',
    'arr_sys':   '#22d3ee',
    'arr_log':   '#1e3a4a',
}

LANES = [
    ('Document Submitter', C['doc_sub']),
    ('Preparer',           C['preparer']),
    ('System / AI Agent',  C['system']),
    ('Reviewer',           C['reviewer']),
    ('Approver',           C['approver']),
    ('Accountant',         C['accountant']),
    ('Reassessment\n(Business Submitter\n+ Controller)', C['reassess']),
]
N_LANES = len(LANES)
LABEL_W  = 2.6
TITLE_H  = 1.0
FOOT_H   = 0.55
USABLE_H = FIG_H - TITLE_H - FOOT_H
LANE_H   = USABLE_H / N_LANES

def ly(i):   return FIG_H - TITLE_H - (i + 1) * LANE_H   # bottom of lane i
def lcy(i):  return ly(i) + LANE_H / 2                    # centre of lane i

LI = {name.split('\n')[0]: i for i, (name, _) in enumerate(LANES)}
LI['System / AI Agent'] = 2
LI['Reassessment'] = 6

# ── Lane backgrounds ───────────────────────────────────────────────────────
for i, (name, color) in enumerate(LANES):
    bg = C['lane_a'] if i % 2 == 0 else C['lane_b']
    ax.add_patch(FancyBboxPatch((0, ly(i)), FIG_W, LANE_H,
                 boxstyle='square,pad=0', lw=0, fc=bg, zorder=0))
    ax.add_patch(FancyBboxPatch((0, ly(i)), 0.22, LANE_H,
                 boxstyle='square,pad=0', lw=0, fc=color, alpha=0.9, zorder=1))
    ax.add_patch(FancyBboxPatch((0.22, ly(i)), LABEL_W - 0.22, LANE_H,
                 boxstyle='square,pad=0', lw=0, fc=color, alpha=0.10, zorder=1))
    ax.text(LABEL_W / 2 + 0.11, lcy(i), name,
            ha='center', va='center', fontsize=8, fontweight='bold',
            color='#cbd5e1', zorder=3, linespacing=1.35)
    ax.axhline(ly(i), color=C['border'], lw=0.5, zorder=2)

ax.axhline(FIG_H - TITLE_H, color=C['border'], lw=0.5, zorder=2)
ax.axvline(LABEL_W, ymin=FOOT_H/FIG_H, ymax=(FIG_H-TITLE_H)/FIG_H,
           color=C['border'], lw=0.9, zorder=2)

# ── Title ──────────────────────────────────────────────────────────────────
ax.text(FIG_W/2, FIG_H - 0.35, 'LeaseGov — Core Workflow',
        ha='center', va='center', fontsize=20, fontweight='bold',
        color=C['text_h'], zorder=10)
ax.text(FIG_W/2, FIG_H - 0.72,
        'End-to-end lease document lifecycle  ·  9 roles  ·  AI-assisted extraction  ·  governed approval  ·  immutable audit trail',
        ha='center', va='center', fontsize=9, color=C['text_m'], zorder=10)

# ── Column positions (evenly spaced) ──────────────────────────────────────
# 8 columns: C0=FC1a, C1=FC1b, C2=FC2a, C3=FC2b, C4=FC3, C5=FC4, C6=FC5, C7=FC6
CX0 = LABEL_W + 0.5
CX_END = FIG_W - 0.8
N_COLS = 9
COL = [CX0 + i * (CX_END - CX0) / (N_COLS - 1) for i in range(N_COLS)]
# COL[0]=upload, COL[1]=OCR/batch, COL[2]=AI extract, COL[3]=manual/verify,
# COL[4]=rev queue, COL[5]=rev review/app queue, COL[6]=app review/record,
# COL[7]=export/reassess, COL[8]=audit log

# ── Phase column dividers ──────────────────────────────────────────────────
phase_cols = [
    (COL[0] - 0.6, 'FC-1\nDocument Pipeline'),
    (COL[2] - 0.6, 'FC-2\nExtraction'),
    (COL[4] - 0.6, 'FC-3\nApprovals'),
    (COL[6] - 0.3, 'FC-4\nRecords'),
    (COL[7] - 0.3, 'FC-5 / FC-6\nExport & Reassessment'),
    (COL[8] - 0.3, 'FC-7/8/9\nAudit & Admin'),
]
for px, plabel in phase_cols:
    ax.axvline(px, ymin=FOOT_H/FIG_H, ymax=(FIG_H-TITLE_H)/FIG_H,
               color=C['border'], lw=0.4, ls='--', zorder=1)
    ax.text(px + 0.15, FIG_H - TITLE_H - 0.15, plabel,
            ha='left', va='top', fontsize=6.8, color=C['text_s'],
            style='italic', zorder=10)

# ── Node helpers ───────────────────────────────────────────────────────────
BW, BH = 1.7, 0.78
SW, SH = 1.4, 0.65
DW, DH = 1.1, 0.65

def box(cx, cy, w, h, label, color, sub=None, zorder=5):
    x0, y0 = cx-w/2, cy-h/2
    ax.add_patch(FancyBboxPatch((x0, y0), w, h,
                 boxstyle='round,pad=0,rounding_size=0.16',
                 lw=1.4, ec=color, fc=color+'26', zorder=zorder))
    ax.plot([x0+0.16, x0+w-0.16], [y0+h, y0+h],
            color=color, lw=2.5, solid_capstyle='round', zorder=zorder+1)
    ty = cy + (0.1 if sub else 0)
    ax.text(cx, ty, label, ha='center', va='center',
            fontsize=8, fontweight='bold', color=C['text_h'],
            zorder=zorder+2, linespacing=1.3)
    if sub:
        ax.text(cx, cy-0.22, sub, ha='center', va='center',
                fontsize=6.5, color=C['text_m'], zorder=zorder+2)

def diamond(cx, cy, w, h, label, color, zorder=5):
    pts = np.array([[cx, cy+h/2],[cx+w/2, cy],[cx, cy-h/2],[cx-w/2, cy]])
    ax.add_patch(plt.Polygon(pts, closed=True, lw=1.4, ec=color,
                             fc=color+'26', zorder=zorder))
    ax.text(cx, cy, label, ha='center', va='center',
            fontsize=7.2, fontweight='bold', color=C['text_h'],
            zorder=zorder+1, linespacing=1.25)

def cylinder(cx, cy, w, h, label, color, zorder=5):
    x0, y0 = cx-w/2, cy-h/2
    ax.add_patch(FancyBboxPatch((x0, y0), w, h,
                 boxstyle='round,pad=0,rounding_size=0.14',
                 lw=1.4, ec=color, fc=color+'20', zorder=zorder))
    ax.add_patch(mpatches.Ellipse((cx, cy+h/2), w, 0.3,
                 lw=1.4, ec=color, fc=color+'44', zorder=zorder+1))
    ax.text(cx, cy, label, ha='center', va='center',
            fontsize=8, fontweight='bold', color=C['text_h'],
            zorder=zorder+2, linespacing=1.3)

def arr(x1, y1, x2, y2, color=None, label=None, rad=0.0, lw=1.5, zorder=4):
    c = color or C['arr_norm']
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=c, lw=lw,
                                connectionstyle=f'arc3,rad={rad}'),
                zorder=zorder)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx+0.06, my+0.14, label, ha='center', va='bottom',
                fontsize=6.5, color=c, zorder=zorder+1,
                bbox=dict(boxstyle='round,pad=0.12', fc=C['bg'],
                          ec='none', alpha=0.88))

# ── Node positions ─────────────────────────────────────────────────────────
# Lane indices
DS = 0  # Document Submitter
PR = 1  # Preparer
SY = 2  # System
RV = 3  # Reviewer
AP = 4  # Approver
AC = 5  # Accountant
RE = 6  # Reassessment

# FC-1
P_upload   = (COL[0], lcy(DS))
P_ocr      = (COL[1], lcy(SY))
P_valid    = (COL[1]+0.9, lcy(SY))
P_batch    = (COL[1], lcy(PR))
P_subq     = (COL[1]+1.0, lcy(PR))

# FC-2
P_aiext    = (COL[2], lcy(SY))
P_confg    = (COL[2]+1.0, lcy(SY))
P_manws    = (COL[3]-0.5, lcy(PR))
P_verify   = (COL[3]+0.5, lcy(PR))

# FC-3
P_revq     = (COL[4], lcy(RV))
P_revrev   = (COL[4]+1.1, lcy(RV))
P_revg     = (COL[4]+2.2, lcy(RV))
P_appq     = (COL[5], lcy(AP))
P_apprev   = (COL[5]+1.1, lcy(AP))
P_appg     = (COL[5]+2.2, lcy(AP))

# FC-4
P_record   = (COL[6]+0.5, lcy(AP))

# FC-5
P_pkg      = (COL[7]-0.5, lcy(AC))
P_comp     = (COL[7]+0.6, lcy(AC))
P_export   = (COL[7]+1.7, lcy(AC))

# FC-6
P_trig     = (COL[7]-0.5, lcy(RE))
P_class    = (COL[7]+0.6, lcy(RE))
P_assess   = (COL[7]+1.7, lcy(RE))
P_memo     = (COL[8]-0.2, lcy(RE))

# Audit log
P_audit    = (COL[8], lcy(SY))

# ── Draw nodes ─────────────────────────────────────────────────────────────
box(*P_upload,  BW, BH, 'Upload\nDocuments',            C['doc_sub'])
box(*P_ocr,     BW, BH, 'OCR Validation\n& Quality Check', C['system'])
diamond(*P_valid, DW, DH, 'Valid?',                     C['system'])
box(*P_batch,   BW, BH, 'Assemble\nBatch',              C['preparer'])
box(*P_subq,    SW, SH, 'Submit to\nExtraction Queue',  C['preparer'])

box(*P_aiext,   BW, BH, 'AI Extraction\n(73 fields)',   C['system'])
diamond(*P_confg, DW, DH, 'Confidence\nOK?',            C['system'])
box(*P_manws,   BW, BH, 'Manual\nWorkspace',            C['preparer'])
box(*P_verify,  BW, BH, 'Verify &\nDisposition',        C['preparer'])

box(*P_revq,    BW, BH, 'Reviewer\nQueue',              C['reviewer'])
box(*P_revrev,  BW, BH, 'Review &\nCorrect',            C['reviewer'])
diamond(*P_revg, DW, DH, 'Approve?',                    C['reviewer'])
box(*P_appq,    BW, BH, 'Approver\nQueue',              C['approver'])
box(*P_apprev,  BW, BH, 'Final\nApproval',              C['approver'])
diamond(*P_appg, DW, DH, 'Approve?',                    C['approver'])

cylinder(*P_record, BW, BH, 'Approved\nRecord',         C['accountant'])

box(*P_pkg,     BW, BH, 'Package\nAssembly',            C['accountant'])
box(*P_comp,    BW, BH, 'Compliance\nPacket',           C['accountant'])
box(*P_export,  BW, BH, 'Export &\nAttestation',        C['accountant'])

box(*P_trig,    BW, BH, 'Trigger\nDetection',           C['reassess'])
box(*P_class,   BW, BH, 'Classification\n& Survey',     C['reassess'])
box(*P_assess,  BW, BH, 'Option\nAssessment',           C['reassess'])
box(*P_memo,    BW, BH, 'Decision\nMemo',               C['reassess'])

cylinder(*P_audit, BW, BH, 'Immutable\nAudit Log',      C['system'])

# ── Draw arrows ─────────────────────────────────────────────────────────────
# FC-1
arr(P_upload[0]+BW/2,  P_upload[1],
    P_ocr[0]-BW/2,     P_ocr[1],    rad=-0.3)
arr(P_ocr[0]+BW/2,     P_ocr[1],
    P_valid[0]-DW/2,   P_valid[1])
# Valid → batch
arr(P_valid[0],        P_valid[1]-DH/2,
    P_batch[0],        P_batch[1]+BH/2,   label='Valid')
# Invalid → rework (back to upload)
arr(P_valid[0]-DW/2,   P_valid[1],
    P_upload[0]+BW/2,  P_upload[1]+BH/3,
    color=C['arr_rew'], label='Invalid', rad=0.45)
# Batch → submit queue
arr(P_batch[0]+BW/2,   P_batch[1],
    P_subq[0]-SW/2,    P_subq[1])

# FC-1 → FC-2
arr(P_subq[0]+SW/2,    P_subq[1],
    P_aiext[0]-BW/2,   P_aiext[1],  rad=-0.3)

# FC-2
arr(P_aiext[0]+BW/2,   P_aiext[1],
    P_confg[0]-DW/2,   P_confg[1])
# Low conf → manual
arr(P_confg[0],        P_confg[1]-DH/2,
    P_manws[0],        P_manws[1]+BH/2,   label='Low conf.')
# High conf → verify
arr(P_confg[0]+DW/2,   P_confg[1],
    P_verify[0]-BW/2,  P_verify[1],
    label='High conf.', rad=-0.3)
# Manual → verify
arr(P_manws[0]+BW/2,   P_manws[1],
    P_verify[0]-BW/2,  P_verify[1])

# FC-2 → FC-3
arr(P_verify[0]+BW/2,  P_verify[1],
    P_revq[0]-BW/2,    P_revq[1],   rad=-0.25)

# FC-3 Reviewer
arr(P_revq[0]+BW/2,    P_revq[1],
    P_revrev[0]-BW/2,  P_revrev[1])
arr(P_revrev[0]+BW/2,  P_revrev[1],
    P_revg[0]-DW/2,    P_revg[1])
# Reviewer decline → rework
arr(P_revg[0]-DW/2,    P_revg[1],
    P_verify[0]+BW/4,  P_verify[1]+BH/2,
    color=C['arr_rew'], label='Decline\nfor Rework', rad=0.35)
# Reviewer approve → approver queue
arr(P_revg[0],         P_revg[1]-DH/2,
    P_appq[0]-BW/2,    P_appq[1]+BH/3,
    label='Approve\nfor Final')

# FC-3 Approver
arr(P_appq[0]+BW/2,    P_appq[1],
    P_apprev[0]-BW/2,  P_apprev[1])
arr(P_apprev[0]+BW/2,  P_apprev[1],
    P_appg[0]-DW/2,    P_appg[1])
# Approver decline → rework
arr(P_appg[0]-DW/2,    P_appg[1],
    P_verify[0]+BW/4,  P_verify[1]-BH/3,
    color=C['arr_rew'], label='Decline\nfor Rework', rad=0.5)
# Approver approve → record
arr(P_appg[0]+DW/2,    P_appg[1],
    P_record[0]-BW/2,  P_record[1],
    label='Approved')

# FC-4 → FC-5
arr(P_record[0]+BW/2,  P_record[1],
    P_pkg[0]-BW/2,     P_pkg[1],    rad=-0.2)

# FC-5
arr(P_pkg[0]+BW/2,     P_pkg[1],
    P_comp[0]-BW/2,    P_comp[1])
arr(P_comp[0]+BW/2,    P_comp[1],
    P_export[0]-BW/2,  P_export[1])

# FC-4 → FC-6 (reassessment trigger)
arr(P_record[0],       P_record[1]-BH/2,
    P_trig[0],         P_trig[1]+BH/2,
    color=C['arr_sys'], label='Amendment /\nOption Trigger', rad=0.0)

# FC-6
arr(P_trig[0]+BW/2,    P_trig[1],
    P_class[0]-BW/2,   P_class[1])
arr(P_class[0]+BW/2,   P_class[1],
    P_assess[0]-BW/2,  P_assess[1])
arr(P_assess[0]+BW/2,  P_assess[1],
    P_memo[0]-BW/2,    P_memo[1])

# Audit log feeds (thin grey)
for sx, sy in [P_verify, P_revrev, P_apprev, P_export, P_memo]:
    ax.annotate('', xy=(P_audit[0]-BW/2, P_audit[1]),
                xytext=(sx, sy+BH/2),
                arrowprops=dict(arrowstyle='->', color=C['arr_log'],
                                lw=0.7, connectionstyle='arc3,rad=0.0'),
                zorder=3)

# ── Legend ─────────────────────────────────────────────────────────────────
lx, ly0 = LABEL_W + 0.5, FOOT_H + 0.12
legend_items = [
    (C['arr_norm'], '─▶  Normal flow'),
    (C['arr_rew'],  '─▶  Decline / Rework'),
    (C['arr_sys'],  '─▶  System trigger'),
    (C['text_m'],   '◇  Decision gate'),
    (C['text_m'],   '⬡  Cylinder = Record / Log'),
]
for i, (c, label) in enumerate(legend_items):
    ax.plot(lx + i*5.4, ly0+0.2, 'o', color=c, ms=5, zorder=10)
    ax.text(lx + i*5.4 + 0.25, ly0+0.2, label,
            va='center', fontsize=7, color=C['text_m'], zorder=10)

# ── Save ───────────────────────────────────────────────────────────────────
plt.tight_layout(pad=0)
plt.savefig('/home/ubuntu/leasegov/core_workflow_diagram.png',
            dpi=180, bbox_inches='tight',
            facecolor=fig.get_facecolor())
plt.close()
print('Saved: core_workflow_diagram.png')
