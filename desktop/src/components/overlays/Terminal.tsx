import { useState, useRef, useEffect } from 'react';
import { useAikaUI } from '../../contexts/AikaUIContext';

export function Terminal() {
  const ui = useAikaUI();
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const print = (line: string) => {
    setOutput((prev) => prev + line + '\n');
    setTimeout(() => bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight), 0);
  };

  const parseCmd = (cmd: string) => {
    const parts = cmd.trim().split(/\s+/);
    const c = (parts[0] || '').toLowerCase();
    const a = parts.slice(1);

    if (!c) return;
    if (c === 'help') {
      print('commands:');
      print('  help');
      print('  clear');
      print('  status');
      print('  voice on | voice off');
      print('  theme <void|cyan|red|violet|emerald>');
      print('  settings open | settings close');
      print('  newchat');
      return;
    }
    if (c === 'clear') {
      setOutput('');
      return;
    }
    if (c === 'status') {
      print(`eyes=${ui.eyesState} focus=${ui.focusMode} voice=${ui.settings.voice}`);
      return;
    }
    if (c === 'voice') {
      const v = (a[0] || '').toLowerCase();
      if (v === 'on') {
        ui.updateSettings({ voice: true });
        print('voice on');
        return;
      }
      if (v === 'off') {
        ui.updateSettings({ voice: false });
        print('voice off');
        return;
      }
      print('usage: voice on | voice off');
      return;
    }
    if (c === 'theme') {
      const key = (a[0] || '').toLowerCase();
      if (['void', 'cyan', 'red', 'violet', 'emerald'].includes(key)) {
        ui.updateSettings({ theme: key as any });
        print(`theme ${key}`);
        return;
      }
      print('unknown theme. try: void cyan red violet emerald');
      return;
    }
    if (c === 'settings') {
      const v = (a[0] || 'open').toLowerCase();
      if (v === 'close') ui.setSettingsOpen(false);
      else ui.setSettingsOpen(true);
      return;
    }
    if (c === 'newchat') {
      print('(new chat - wire to app newChat)');
      return;
    }
    print('unknown command. type `help`');
  };

  useEffect(() => {
    if (ui.terminalOpen) {
      inputRef.current?.focus();
      if (!output) print('AIKA TERMINAL :: type `help`');
    }
  }, [ui.terminalOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = input;
      setInput('');
      print('> ' + cmd);
      parseCmd(cmd);
    }
    if (e.key === 'Escape') ui.setTerminalOpen(false);
  };

  return (
    <div className={`terminal ${ui.terminalOpen ? 'show' : ''}`} id="terminal" aria-label="Command terminal">
      <div className="terminalHead">
        <div>AIKA :: TERMINAL</div>
        <div className="hint">ESC to close</div>
      </div>
      <div className="terminalBody" id="termOut" ref={bodyRef}>
        {output}
      </div>
      <div className="terminalInputRow">
        <div className="terminalPrompt">&gt;</div>
        <input
          ref={inputRef}
          className="terminalInput"
          id="termIn"
          placeholder="help, voice on, theme cyan..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
