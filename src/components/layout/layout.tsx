import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "~/assets/styles/globals.css";
import { ErrorBoundary } from "~/components/common/error-boundary";
import { Suspense } from "~/components/common/suspense";
import { Header } from "~/components/layout/header";
import { Toaster } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";

interface LayoutProps {
  readonly children: React.ReactNode;
  readonly loadingFallback?: React.ReactElement;
  readonly errorFallback?: React.ReactElement;
  readonly className?: string;
}

const queryClient = new QueryClient();

export const Layout = ({
  children,
  loadingFallback,
  errorFallback,
  className,
}: LayoutProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={loadingFallback}>
          <LayoutContent className={className}>{children}</LayoutContent>
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
};

const LayoutContent = ({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex min-h-screen bg-black text-foreground w-full min-w-[23rem] flex-col items-center justify-center font-sans text-base"
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-[80rem] grow flex-col items-center justify-baseline gap-2 p-5",
          className
        )}
      >
        <Header />
        {children}
      </div>
      <Toaster />
    </div>
  );
};
