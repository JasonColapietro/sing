"""Pull the piano guide out of a warm-up video: stable pitched notes, grouped
into phrases, with the root of each phrase so key climbs are visible.

Usage: python analyze.py file.wav > out.txt
"""
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft, medfilt

path = sys.argv[1]
sr, y = wavfile.read(path)
if y.dtype.kind == "i":
    y = y.astype(np.float32) / np.iinfo(y.dtype).max
if y.ndim > 1:
    y = y.mean(axis=1)

N = 4096
HOP = 512
f, t, Z = stft(y, fs=sr, nperseg=N, noverlap=N - HOP, boundary=None)
mag = np.abs(Z)  # (freq, time)
rms = np.sqrt((y[: len(y) // HOP * HOP].reshape(-1, HOP) ** 2).mean(axis=1))
rms = rms[: mag.shape[1]]
t = t[: len(rms)]
mag = mag[:, : len(rms)]

# Harmonic product spectrum over a singable/piano range.
fmin, fmax = 55.0, 1400.0
cands = f[(f >= fmin) & (f <= fmax)]
idx0 = np.searchsorted(f, cands)
def hps(col):
    prod = np.ones(len(cands))
    for h in (1, 2, 3, 4):
        hi = np.minimum(idx0 * h, len(col) - 1)
        prod *= col[hi] + 1e-9
    return prod

midis = np.full(len(t), np.nan)
clar = np.zeros(len(t))
for i in range(mag.shape[1]):
    col = mag[:, i]
    if rms[i] < 0.004:
        continue
    p = hps(col)
    k = int(np.argmax(p))
    f0 = cands[k]
    # Octave-error guard: if half-frequency has comparable HPS, prefer it.
    if k > 0:
        half = f0 / 2
        j = int(np.argmin(np.abs(cands - half)))
        if p[j] > 0.6 * p[k]:
            f0 = cands[j]
    midis[i] = 69 + 12 * np.log2(f0 / 440.0)
    clar[i] = p[k] / (p.sum() + 1e-9)

# Smooth and segment into stable notes.
m = midis.copy()
valid = ~np.isnan(m)
m_f = m.copy()
m_f[~valid] = 0
m_f = medfilt(m_f, 5)
m_f[~valid] = np.nan

frame_sec = HOP / sr
MIN_NOTE = 0.12
notes = []  # (start, end, midi)
i = 0
n = len(m_f)
while i < n:
    if np.isnan(m_f[i]) or clar[i] < 0.02:
        i += 1
        continue
    j = i + 1
    while j < n and not np.isnan(m_f[j]) and abs(m_f[j] - m_f[i]) < 0.45:
        j += 1
    dur = (j - i) * frame_sec
    if dur >= MIN_NOTE:
        seg = m_f[i:j]
        notes.append((t[i], t[j - 1] + frame_sec, float(np.median(seg))))
    i = j

# Group notes into phrases split by gaps.
GAP = 0.7
phrases = []
cur = []
for nt in notes:
    if cur and nt[0] - cur[-1][1] > GAP:
        phrases.append(cur)
        cur = []
    cur.append(nt)
if cur:
    phrases.append(cur)

NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
def name(mf):
    mi = int(round(mf))
    return f"{NAMES[mi % 12]}{mi // 12 - 1}"

def fmt(sec):
    return f"{int(sec // 60)}:{int(sec % 60):02d}"

print(f"# {path}  {len(notes)} stable notes, {len(phrases)} phrases")
for ph in phrases:
    if len(ph) < 2:
        continue
    start, end = ph[0][0], ph[-1][1]
    ms = [round(p[2]) for p in ph]
    root = min(ms)
    rel = [x - root for x in ms]
    durs = [round(p[1] - p[0], 2) for p in ph]
    print(
        f"{fmt(start)}-{fmt(end)} ({end-start:4.1f}s) root {name(root):4s} "
        f"notes {' '.join(name(x) for x in ms)} | rel {rel} | durs {durs}"
    )
