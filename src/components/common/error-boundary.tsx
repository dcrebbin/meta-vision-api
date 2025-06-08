import { Component } from "react";

import type { ReactElement } from "react";

const ErrorContent = () => {
  return (
    <div className="flex w-full min-w-64 items-center justify-center px-10 py-16">
      <span className="text-center text-destructive">
        Something went wrong. Please try again later.
      </span>
    </div>
  );
};

class ReactErrorBoundary extends Component<
  {
    children: ReactElement;
    fallback: ReactElement;
  },
  {
    hasError: boolean;
  }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export const ErrorBoundary = ({
  children,
  fallback = <ErrorContent />,
}: {
  children: ReactElement;
  fallback?: ReactElement;
}) => {
  return (
    <ReactErrorBoundary fallback={fallback}>{children}</ReactErrorBoundary>
  );
};
