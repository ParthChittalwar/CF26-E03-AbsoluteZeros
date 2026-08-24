import { AlertTriangle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red/40 bg-red/10 p-4">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red" />
      <p className="flex-1 text-sm text-ink2">{message}</p>
      <button onClick={onDismiss} className="text-muted hover:text-ink2">
        <X size={16} />
      </button>
    </div>
  );
}
