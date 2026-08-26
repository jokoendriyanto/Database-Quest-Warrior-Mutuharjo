import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  /** Current avatar image URL (from Convex storage) or null */
  avatarUrl: string | null;
  /** Fallback emoji when no image */
  emoji: string;
  /** Callback when avatar changes */
  onAvatarChange?: (url: string | null) => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "size-10 text-xl",
  md: "size-16 text-3xl",
  lg: "size-24 text-5xl",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function AvatarUpload({
  avatarUrl,
  emoji,
  onAvatarChange,
  size = "lg",
}: AvatarUploadProps) {
  const generateUploadUrl = useMutation(api.profile.generateAvatarUploadUrl);
  const saveAvatar = useMutation(api.profile.saveAvatar);
  const removeAvatar = useMutation(api.profile.removeAvatar);

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validasi
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Format tidak didukung. Pakai JPG, PNG, WebP, atau GIF.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Ukuran maksimal 2MB.");
        return;
      }

      // Preview lokal
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        setUploading(true);
        // 1. Dapatkan upload URL
        const uploadUrl = await generateUploadUrl();

        // 2. Upload file langsung ke Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error("Gagal upload file.");

        const { storageId } = await result.json();

        // 3. Simpan reference ke user record
        await saveAvatar({ storageId });

        // Dapatkan URL baru
        const newUrl = URL.createObjectURL(file);
        onAvatarChange?.(newUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal upload avatar.");
        setPreview(null);
      } finally {
        setUploading(false);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [generateUploadUrl, saveAvatar, onAvatarChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset input agar bisa upload file yang sama
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await removeAvatar();
      setPreview(null);
      onAvatarChange?.(null);
    } catch {
      setError("Gagal menghapus avatar.");
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview ?? avatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar display */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "relative overflow-hidden border-2 border-primary/40 transition-all hover:border-primary",
            SIZE_CLASSES[size],
            !displayUrl && "grid place-items-center bg-secondary",
            uploading && "opacity-60",
          )}
          aria-label="Upload avatar baru"
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="size-full object-cover"
            />
          ) : (
            <span aria-hidden>{emoji}</span>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="size-5 animate-spin text-white" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </div>
        </button>

        {/* Remove button */}
        {displayUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -bottom-1 -right-1 rounded-full border border-border bg-card p-1 text-destructive transition-colors hover:bg-destructive hover:text-white"
            aria-label="Hapus avatar"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Status text */}
      {uploading && (
        <p className="font-mono text-[10px] text-muted-foreground">
          Mengupload...
        </p>
      )}
      {error && (
        <p className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
          {error}
        </p>
      )}
      {!uploading && !error && (
        <p className="font-mono text-[10px] text-muted-foreground">
          Klik untuk upload · JPG/PNG/WebP/GIF · max 2MB
        </p>
      )}
    </div>
  );
}
