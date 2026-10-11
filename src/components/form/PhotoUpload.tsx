import { ImagePlus, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export interface PhotoValue {
  dataUrl: string;
  name: string;
}

export function PhotoUpload({
  value,
  onChange,
}: {
  value: PhotoValue | null;
  onChange: (v: PhotoValue | null) => void;
}) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = (file?: File) => {
    setError(null);
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setError(t("errors.fileType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("errors.fileTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange({ dataUrl: String(reader.result), name: file.name });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-4 border border-border bg-surface p-3">
          <img
            src={value.dataUrl}
            alt={value.name}
            className="size-20 shrink-0 border border-border object-cover"
            style={{ borderRadius: 2 }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{value.name}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-primary hover:underline"
            >
              {t("reclamation.photoChange")}
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("reclamation.photoRemove")}
            onClick={() => onChange(null)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 border border-dashed border-border bg-background px-6 py-8 text-center transition-colors",
            "hover:border-primary/60 hover:bg-surface",
          )}
          style={{ borderRadius: 3 }}
        >
          <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">{t("reclamation.photoButton")}</span>
          <span className="text-xs text-muted-foreground">{t("reclamation.photoHint")}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
