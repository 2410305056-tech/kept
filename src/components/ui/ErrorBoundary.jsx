import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Panel render failed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      this.props.fallback ?? (
        <div className="p-4 border border-[var(--line)] rounded-[8px] bg-[var(--surface-1)] text-xs font-mono text-[var(--text-3)]">
          This panel could not render.
        </div>
      )
    );
  }
}

export function PanelBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-[64px] flex items-center justify-center border border-[var(--line)] rounded-[8px] bg-[var(--surface-1)] text-[11px] font-mono text-[var(--text-3)]">
          Chart unavailable
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
