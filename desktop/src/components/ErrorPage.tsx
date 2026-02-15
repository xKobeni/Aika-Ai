import type { ReactNode } from 'react';

export type ErrorPageCode = 404 | 500 | 'error';

interface ErrorPageProps {
  code?: ErrorPageCode;
  title?: string;
  message?: string;
  /** Primary action label, e.g. "Go home" or "Reload" */
  actionLabel?: string;
  onAction?: () => void;
  /** Optional secondary link or text */
  secondary?: ReactNode;
}

const DEFAULT_CONTENT: Record<
  ErrorPageCode,
  { title: string; message: string; actionLabel: string }
> = {
  404: {
    title: 'Signal lost',
    message: 'This page isn’t in the grid. The route you requested doesn’t exist or was moved.',
    actionLabel: 'Return to base',
  },
  500: {
    title: 'System fault',
    message: 'Something broke on our side. We’ve logged it and are looking into the issue.',
    actionLabel: 'Reload',
  },
  error: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Try reloading or going back.',
    actionLabel: 'Reload page',
  },
};

export function ErrorPage({
  code = 404,
  title,
  message,
  actionLabel,
  onAction,
  secondary,
}: ErrorPageProps) {
  const content = DEFAULT_CONTENT[code];
  const displayTitle = title ?? content.title;
  const displayMessage = message ?? content.message;
  const displayActionLabel = actionLabel ?? content.actionLabel;
  const displayCode = typeof code === 'number' ? String(code) : 'ERR';

  return (
    <div className="errorPage">
      <div className="errorPage-bg" aria-hidden />
      <div className="errorPage-scan" aria-hidden />
      <div className="errorPage-grid" aria-hidden />

      <div className="errorPage-inner">
        <div className="errorPage-codeWrap">
          <span className="errorPage-code errorPage-code--main" data-code={displayCode}>
            {displayCode}
          </span>
          <span className="errorPage-code errorPage-code--glitch" aria-hidden data-code={displayCode}>
            {displayCode}
          </span>
        </div>

        <div className="errorPage-card">
          <h1 className="errorPage-title">{displayTitle}</h1>
          <p className="errorPage-message">{displayMessage}</p>

          {onAction && (
            <button
              type="button"
              className="errorPage-btn"
              onClick={onAction}
            >
              {displayActionLabel}
            </button>
          )}

          {secondary && <div className="errorPage-secondary">{secondary}</div>}
        </div>

        <p className="errorPage-mono">
          {code === 404 && 'NOT_FOUND'}
          {code === 500 && 'INTERNAL_SERVER_ERROR'}
          {code === 'error' && 'UNCAUGHT_EXCEPTION'}
        </p>
      </div>
    </div>
  );
}
