import { useAikaUI } from '../../contexts/AikaUIContext';
import type { ThemeKey } from '../../contexts/AikaUIContext';

const THEMES: { value: ThemeKey; label: string }[] = [
  { value: 'void', label: 'VOID WHITE' },
  { value: 'cyan', label: 'CYAN CORE' },
  { value: 'red', label: 'RED SENTINEL' },
  { value: 'violet', label: 'VIOLET QUANTUM' },
  { value: 'emerald', label: 'EMERALD REACTOR' },
];

export function SettingsDrawer() {
  const ui = useAikaUI();
  const s = ui.settings;

  return (
    <>
      <div
        className={`settingsBackdrop ${ui.settingsOpen ? 'show' : ''}`}
        aria-hidden={!ui.settingsOpen}
        onClick={() => ui.setSettingsOpen(false)}
      />
      <aside className={`settingsDrawer ${ui.settingsOpen ? 'open' : ''}`} id="settingsDrawer" aria-label="Settings">
        <div className="settingsInner">
          <div className="settingsHead">
            <div className="title">Settings</div>
            <button
              type="button"
              className="btn icon"
              id="btnCloseSettings"
              title="Close"
              onClick={() => ui.setSettingsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="settingsSections">
            <div className="section">
              <div className="sectionTitle2">
                General <span className="hint">app</span>
              </div>
              <div className="toggle">
                <div className="name">Start Listening (dummy)</div>
                <div
                  className={`switch ${s.listening ? 'on' : ''}`}
                  role="switch"
                  aria-checked={s.listening}
                  onClick={() => ui.updateSettings({ listening: !s.listening })}
                />
              </div>
              <div className="toggle">
                <div className="name">Voice Mode (mic + TTS)</div>
                <div
                  className={`switch ${s.voice ? 'on' : ''}`}
                  role="switch"
                  aria-checked={s.voice}
                  onClick={() => ui.updateSettings({ voice: !s.voice })}
                />
              </div>
              <div className="toggle">
                <div className="name">Wake word (say &quot;Aika…&quot; to activate)</div>
                <div
                  className={`switch ${s.wakeWordMode ? 'on' : ''}`}
                  role="switch"
                  aria-checked={s.wakeWordMode}
                  onClick={() => ui.updateSettings({ wakeWordMode: !s.wakeWordMode })}
                />
              </div>
              <div className="toggle">
                <div className="name">Sound (synth)</div>
                <div
                  className={`switch ${s.sound ? 'on' : ''}`}
                  role="switch"
                  aria-checked={s.sound}
                  onClick={() => ui.updateSettings({ sound: !s.sound })}
                />
              </div>
              <div className="toggle" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div className="sectionTitle2" style={{ border: 'none', padding: 0 }}>
                  Theme
                </div>
                <select
                  className="select"
                  id="themeSelect"
                  value={s.theme}
                  onChange={(e) => ui.updateSettings({ theme: e.target.value as ThemeKey })}
                >
                  {THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="section">
              <div className="sectionTitle2">
                Visuals <span className="hint">crt / hud</span>
              </div>
              <div className="toggle">
                <div className="name">Eyes follow cursor</div>
                <div
                  className={`switch ${s.eyesFollowCursor ? 'on' : ''}`}
                  role="switch"
                  aria-checked={s.eyesFollowCursor}
                  onClick={() => ui.updateSettings({ eyesFollowCursor: !s.eyesFollowCursor })}
                />
              </div>
              <div className="toggle">
                <div className="name">Cyan Accents</div>
                <div
                  className={`switch ${s.cyanAccents ? 'on' : ''}`}
                  role="switch"
                  aria-checked={s.cyanAccents}
                  onClick={() => ui.updateSettings({ cyanAccents: !s.cyanAccents })}
                />
              </div>
              <div className="sliderRow">
                <div className="sliderTop">
                  <div className="label">CRT Intensity</div>
                  <div className="val">{s.crt}%</div>
                </div>
                <input
                  type="range"
                  id="sliderCRT"
                  min={0}
                  max={60}
                  value={s.crt}
                  onChange={(e) => ui.updateSettings({ crt: Number(e.target.value) })}
                />
              </div>
              <div className="sliderRow">
                <div className="sliderTop">
                  <div className="label">HUD Opacity</div>
                  <div className="val">{s.hud}%</div>
                </div>
                <input
                  type="range"
                  id="sliderHUD"
                  min={0}
                  max={30}
                  value={s.hud}
                  onChange={(e) => ui.updateSettings({ hud: Number(e.target.value) })}
                />
              </div>
              <div className="sliderRow">
                <div className="sliderTop">
                  <div className="label">Background Pulse</div>
                  <div className="val">{s.pulse}%</div>
                </div>
                <input
                  type="range"
                  id="sliderPulse"
                  min={0}
                  max={25}
                  value={s.pulse}
                  onChange={(e) => ui.updateSettings({ pulse: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="section">
              <div className="sectionTitle2">
                Particles <span className="hint">ambient</span>
              </div>
              <div className="sliderRow">
                <div className="sliderTop">
                  <div className="label">Particle Count</div>
                  <div className="val">{s.particleCount}</div>
                </div>
                <input
                  type="range"
                  id="sliderPCount"
                  min={0}
                  max={180}
                  value={s.particleCount}
                  onChange={(e) => ui.updateSettings({ particleCount: Number(e.target.value) })}
                />
              </div>
              <div className="sliderRow">
                <div className="sliderTop">
                  <div className="label">Particle Opacity</div>
                  <div className="val">{s.particleOpacity}%</div>
                </div>
                <input
                  type="range"
                  id="sliderPOp"
                  min={0}
                  max={100}
                  value={s.particleOpacity}
                  onChange={(e) => ui.updateSettings({ particleOpacity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="section">
              <div className="sectionTitle2">
                Dev <span className="hint">tools</span>
              </div>
              <div className="sectionTitle2" style={{ marginBottom: 6 }}>
                Expressions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {(['neutral', 'curious', 'angry', 'surprised', 'sleepy', 'focused', 'sad', 'happy', 'suspicious', 'bored', 'excited'] as const).map((expr) => (
                  <button
                    key={expr}
                    type="button"
                    className="btn"
                    style={{
                      textTransform: 'capitalize',
                      ...(ui.exprOverride === expr
                        ? { borderColor: 'rgba(80,240,255,.4)', boxShadow: '0 0 12px rgba(80,240,255,.15)' }
                        : {}),
                    }}
                    onClick={() => {
                      ui.setEyesState('idle');
                      ui.setExprOverride(expr);
                    }}
                  >
                    {expr}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn"
                  onClick={() => ui.setExprOverride(null)}
                >
                  Auto
                </button>
              </div>
              <button
                type="button"
                className="btn"
                id="btnTestError"
                onClick={() => {
                  ui.setEyesState('error');
                  ui.setExprOverride('angry');
                  ui.setBlinkTrigger({ strength: 1.2 });
                  ui.triggerGlitch();
                  const scaredDurationMs = 2500;
                  setTimeout(() => {
                    ui.setEyesState('idle');
                    ui.setExprOverride('surprised');
                  }, 300);
                  setTimeout(() => {
                    ui.setExprOverride(null);
                  }, 300 + scaredDurationMs);
                }}
              >
                Test Error
              </button>
              <div className="hint">Terminal: press ` (tilde)</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
