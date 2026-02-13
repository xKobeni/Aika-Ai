interface HeroProps {
  onQuickAction: (action: 'image' | 'brainstorm' | 'plan' | 'agent') => void;
}

export function Hero({ onQuickAction }: HeroProps) {
  const actions = [
    { action: 'image' as const, icon: '🎨', label: 'Create image' },
    { action: 'brainstorm' as const, icon: '💡', label: 'Brainstorm' },
    { action: 'plan' as const, icon: '🧭', label: 'Make a plan' },
    { action: 'agent' as const, icon: '🤖', label: 'Pick an agent' },
  ];

  return (
    <section className="hero">
      <div className="hero__center">
        <div className="hero__orb">
          <div className="hero__orbInner" />
        </div>
        <h1 className="hero__title">Ready to create something new?</h1>
        <p className="hero__subtitle">
          Aika is standing by with agents, tools, memory, files, image generation & voice — all in one focused workspace.
        </p>

        <div className="quickActions">
          {actions.map(({ action, icon, label }) => (
            <button
              key={action}
              type="button"
              className="qa"
              data-action={action}
              onClick={() => onQuickAction(action)}
            >
              {icon} <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
