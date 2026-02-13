import { useState } from 'react';
import { Modal, Button, Card, Pill } from './ui';

interface PersonalityModalProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_PERSONALITY = `Calm, soft-spoken assistant. Always steady and composed.
Answers are clear and concise, with gentle, human tone.
Thinks before replying; admits uncertainty instead of guessing.
Offers extra detail only when it truly helps.
Occasionally checks in: "Did that help?" or "How's that going?"
Remembers conversation context and refers back when relevant.`;

const PERSONALITY_PRESETS = [
  {
    id: 'calm',
    name: 'Calm Companion',
    tagline: 'Soft-spoken, steady, thoughtful',
    traits: ['Gentle', 'Composed', 'Thoughtful'],
    instructions: DEFAULT_PERSONALITY,
  },
  {
    id: 'builder',
    name: 'Focused Builder',
    tagline: 'Code-first, minimal explanation',
    traits: ['Precise', 'Direct', 'Practical'],
    instructions: `Code-first approach. Prioritize working solutions over long explanations.
Keep answers concise unless asked for detail.
Prefer TypeScript + React patterns.
Ship working code over theory.`,
  },
  {
    id: 'teacher',
    name: 'Patient Teacher',
    tagline: 'Step-by-step, educational',
    traits: ['Educational', 'Detailed', 'Supportive'],
    instructions: `Explain concepts step-by-step with context.
Break down complex topics into digestible parts.
Provide examples and analogies when helpful.
Encourage questions and learning.`,
  },
  {
    id: 'researcher',
    name: 'Thorough Researcher',
    tagline: 'Cites sources, explores alternatives',
    traits: ['Analytical', 'Thorough', 'Evidence-based'],
    instructions: `Present multiple perspectives when relevant.
Cite assumptions and limitations.
Explore alternatives before recommending.
Show reasoning behind conclusions.`,
  },
];

export function PersonalityModal({ open, onClose }: PersonalityModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('calm');
  const [customInstructions, setCustomInstructions] = useState(DEFAULT_PERSONALITY);
  const [isEditing, setIsEditing] = useState(false);

  const currentPreset = PERSONALITY_PRESETS.find((p) => p.id === selectedPreset) || PERSONALITY_PRESETS[0];

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PERSONALITY_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCustomInstructions(preset.instructions);
      setIsEditing(false);
    }
  };

  const handleSave = () => {
    // TODO: Wire to backend API or app state
    console.log('Saving personality:', { preset: selectedPreset, instructions: customInstructions });
    // For now, just show a toast or update local state
    setIsEditing(false);
    onClose();
  };

  const handleReset = () => {
    const preset = PERSONALITY_PRESETS.find((p) => p.id === selectedPreset);
    if (preset) {
      setCustomInstructions(preset.instructions);
      setIsEditing(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Aika Personality"
      onClose={onClose}
      wide={true}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={handleReset} disabled={!isEditing}>
            Reset
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Personality
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Preset Selection */}
        <Card title="Personality Presets">
          <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
            Choose a base personality, then customize the instructions below.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {PERSONALITY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.id)}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: `1px solid ${
                    selectedPreset === preset.id
                      ? 'rgba(182, 124, 255, 0.4)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }`,
                  background:
                    selectedPreset === preset.id
                      ? 'rgba(182, 124, 255, 0.15)'
                      : 'rgba(0, 0, 0, 0.2)',
                  color: 'rgba(242, 243, 255, 0.95)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedPreset !== preset.id) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPreset !== preset.id) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                  }
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{preset.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(242, 243, 255, 0.6)', marginBottom: 8 }}>
                  {preset.tagline}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {preset.traits.map((trait) => (
                    <Pill key={trait}>{trait}</Pill>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Current Personality Display */}
        <Card title="Current Personality">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="agentAvatar" style={{ width: 48, height: 48, fontSize: 24 }}>
              ✦
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{currentPreset.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(242, 243, 255, 0.6)' }}>
                {currentPreset.tagline}
              </div>
            </div>
          </div>

          <div className="pillRow" style={{ marginBottom: 12 }}>
            {currentPreset.traits.map((trait) => (
              <Pill key={trait}>{trait}</Pill>
            ))}
          </div>
        </Card>

        {/* Custom Instructions */}
        <Card title="Custom Instructions">
          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Define how Aika should behave, communicate, and respond. These instructions are sent
            with every request to shape Aika's personality and style.
          </div>

          <textarea
            rows={8}
            value={customInstructions}
            onChange={(e) => {
              setCustomInstructions(e.target.value);
              setIsEditing(true);
            }}
            placeholder="Describe how Aika should behave..."
            style={{
              width: '100%',
              resize: 'vertical',
              outline: 'none',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(0, 0, 0, 0.25)',
              color: 'rgba(242, 243, 255, 0.92)',
              padding: 14,
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            }}
          />

          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
            💡 Tip: Be specific about tone, detail level, and communication style. Changes take
            effect after saving.
          </div>
        </Card>

        {/* Personality Traits Summary */}
        <Card title="Personality Traits">
          <div className="kv">
            <div className="kv__row">
              <span>Communication Style</span>
              <span>Clear, gentle, concise</span>
            </div>
            <div className="kv__row">
              <span>Detail Level</span>
              <span>Concise unless asked</span>
            </div>
            <div className="kv__row">
              <span>Formality</span>
              <span>Casual, friendly</span>
            </div>
            <div className="kv__row">
              <span>Thinking Style</span>
              <span>Reflective, admits uncertainty</span>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
