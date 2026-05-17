"use client";

import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface Props {
  onFile: (dataUrl: string, file: File) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFile, disabled }: Props) {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setPreview(url);
        onFile(url, file);
      };
      reader.readAsDataURL(file);
    },
    [onFile]
  );

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-bg-elevated">
        <img src={preview} alt="Field" className="w-full max-h-[480px] object-contain bg-black" />
        {!disabled && (
          <button
            onClick={() => setPreview(null)}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur hover:bg-black/80 border border-white/10"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="absolute bottom-3 left-3 right-3 glass rounded-xl px-3 py-2 border border-white/10 text-xs text-muted flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" /> Field image ready for analysis
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      className={`block cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
        drag ? "border-accent-primary bg-accent-primary/5" : "border-white/10 bg-bg-elevated/40 hover:border-white/20"
      } px-6 py-16 text-center`}
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mb-4">
        <Upload className="w-6 h-6 text-accent-glow" />
      </div>
      <div className="text-lg font-semibold mb-1">Upload a field photo or satellite snippet</div>
      <div className="text-sm text-muted">Drop an image here or click to browse — JPG, PNG, WebP (max 10 MB)</div>
      <div className="text-xs text-muted-dim mt-3">Works best with overhead views taken on a clear day</div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </label>
  );
}
