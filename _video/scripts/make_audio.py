"""Синтез саундтрека под тайминг из src/timing.json → public/qtomate_sfx.wav"""
import json, sys, wave
from pathlib import Path
import numpy as np

root = Path(__file__).resolve().parent.parent
T = json.loads((root / 'src/timing.json').read_text())
SR = 44100
fps, bpm = T['fps'], T['bpm']
dur = T['total'] / fps + 1.5
n = int(SR * dur)
L = np.zeros(n); Rr = np.zeros(n)
rng = np.random.default_rng(7)
t_of = lambda frame: frame / fps

def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= n: return
    sig = sig[: n - i]
    L[i:i + len(sig)] += sig * gain * (1 - max(pan, 0))
    Rr[i:i + len(sig)] += sig * gain * (1 + min(pan, 0))

def env(length, a=0.002, d=0.2):
    t = np.arange(int(length * SR)) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)

def lowpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[f > cutoff] *= np.exp(-(f[f > cutoff] - cutoff) / (cutoff * 0.3))
    return np.fft.irfft(X, len(x))

def highpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[f < cutoff] = 0
    return np.fft.irfft(X, len(x))

def kick():
    ln = 0.45; t = np.arange(int(ln * SR)) / SR
    freq = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(ln, 0.001, 0.16) + 0.3 * rng.standard_normal(len(t)) * env(ln, 0.0005, 0.004)

def hat():
    return highpass(rng.standard_normal(int(0.08 * SR)), 7000) * env(0.08, 0.0005, 0.018)

def whoosh(ln=0.45):
    m = int(ln * SR); t = np.arange(m) / SR
    noise = rng.standard_normal(m)
    out = np.zeros(m); seg = 2048
    for s in range(0, m, seg):  # нарастающий фильтр
        c = 300 + 9000 * (s / m) ** 2
        out[s:s + seg] = lowpass(noise[s:s + seg], c)
    return out * (t / ln) ** 2.2 * 0.6

def impact():
    ln = 1.6; t = np.arange(int(ln * SR)) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-t * 9)) / SR) * env(ln, 0.001, 0.5)
    crack = lowpass(rng.standard_normal(len(t)), 5000) * env(ln, 0.0005, 0.08)
    return boom * 0.9 + crack * 0.5

def blip(freq=1320):
    ln = 0.12; t = np.arange(int(ln * SR)) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)) * env(ln, 0.001, 0.035)

def riser(ln):
    m = int(ln * SR); t = np.arange(m) / SR
    f = 180 * (8 ** (t / ln))
    tone = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.15 + np.sin(2 * np.pi * np.cumsum(f * 0.5) / SR) * 0.4
    return lowpass(tone, 4000) * (t / ln) ** 1.5 * 0.35

beat = 60 / bpm
starts = [s['start'] for s in T['scenes']]
logo_t = t_of(starts[-1])

# ритм: бочка на долю, хэт на слабую долю, до финала
b = 0.0
while b < logo_t - 0.01:
    add(kick(), b, 0.9)
    add(hat(), b + beat / 2, 0.25, pan=0.3)
    b += beat

# бас: синус по 2 такта, с «пампингом» от бочки
notes = [55.0, 43.65, 65.41, 49.0]
bass = np.zeros(n); tt = np.arange(n) / SR
for i in range(int(logo_t / (beat * 8)) + 1):
    a, z = int(i * beat * 8 * SR), int(min((i + 1) * beat * 8, logo_t) * SR)
    if a >= z: break
    f = notes[i % len(notes)]
    bass[a:z] = np.sin(2 * np.pi * f * tt[a:z]) + 0.25 * np.sin(2 * np.pi * f * 2 * tt[a:z])
pump = 1 - 0.85 * np.exp(-((tt % beat)) / 0.09)
bass *= pump * 0.32
L += bass; Rr += bass

# переходы: свист перед стыком, удар на стыке
for s in starts[1:]:
    add(whoosh(), t_of(s) - 0.45, 0.7, pan=-0.2)
    add(impact(), t_of(s), 0.55 if s != starts[-1] else 1.0)
add(impact(), 0.0, 0.6)

# сцена скана: райзер и блипы на выносках
scan = next(s for s in T['scenes'] if s['id'] == 'scan')
sf = T['scan']
add(riser(t_of(sf['to'] - sf['from'])), t_of(scan['start'] + sf['from']), 0.8)
for i, c in enumerate(T['callouts']):
    fr = sf['from'] + (sf['to'] - sf['from']) * (c['ax'] - sf['x0']) / (sf['x1'] - sf['x0'])
    add(blip(1100 + i * 140), t_of(scan['start'] + fr), 0.35, pan=(i - 2) * 0.2)

# сцена утверждения: щелчок на каждую утверждённую строку
appr = next(s for s in T['scenes'] if s['id'] == 'approve')
A = T['approve']
for j in range(len(A['order'])):
    add(blip(880 + j * 110), t_of(appr['start'] + A['firstTick'] + j * A['tickEvery']), 0.4, pan=(j - 2) * 0.15)

# финал: аккорд-пэд с затуханием
ln = dur - logo_t; t = np.arange(int(ln * SR)) / SR
pad = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([110, 164.8, 220, 277.2, 329.6]))
pad = lowpass(pad, 2500) * np.minimum(t / 0.05, 1) * np.exp(-t / 1.8) * 0.12
add(pad, logo_t, 1.0)

# мягкая компрессия и нормализация
mix = np.stack([L, Rr], 1)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix /= np.max(np.abs(mix)) / 0.89
fade = int(0.3 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
out = root / 'public/qtomate_sfx.wav'
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out, f'{dur:.1f}s')
