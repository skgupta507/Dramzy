import { AlertTriangle } from "@/components/icons";

export function ApiUnavailableRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border border-border rounded bg-secondary/20 text-sm text-muted-foreground w-full">
      <AlertTriangle className="w-4 h-4 text-yellow-500/70 shrink-0" />
      <span>Content unavailable — check <code className="text-brand-400 text-xs">XYRA_API_KEY</code> in your .env</span>
    </div>
  );
}

export function ApiUnavailable({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <AlertTriangle className="w-10 h-10 text-yellow-500/50" />
      <div>
        <p className="font-semibold text-foreground">{message ?? "Content unavailable"}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Check that <code className="text-brand-400">XYRA_API_KEY</code> and <code className="text-brand-400">XYRA_API_URL</code> are set correctly.
        </p>
      </div>
    </div>
  );
}
