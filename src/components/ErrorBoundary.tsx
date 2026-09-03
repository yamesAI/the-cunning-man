// Error boundary: a widget must never render as a blank page.
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ fontFamily: "Georgia, serif", padding: 16, color: "#333" }}>
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>Shield Astrological Clock</h1>
          <p style={{ fontSize: 13, fontStyle: "italic" }}>
            The chart could not start in this context ({this.state.error.message}).
            Try reloading the widget.
          </p>
        </main>
      );
    }
    return this.props.children;
  }
}
