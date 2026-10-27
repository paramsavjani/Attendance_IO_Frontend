import { useRef, useState } from "react";
import { Eye, ImagePlus, Loader2, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { PhotoViewer, DEFAULT_AVATAR } from "@/components/PhotoViewer";
import { PhotoCropper } from "@/components/profile/PhotoCropper";
import { uploadProfilePicture, removeProfilePicture } from "@/lib/profilePicture";
import { cn } from "@/lib/utils";

interface ProfileHeroProps {
  name?: string;
  rollNumber?: string;
  pictureUrl?: string;
  hasUploadedPicture?: boolean;
  /** The shared demo account can look but not change the photo. */
  canEdit: boolean;
  /** e.g. "2026 Autumn"; undefined while loading, null when there is none. */
  semesterLabel?: string | null;
  /** Reloads the signed-in student after the photo changes. */
  onPhotoChanged: () => Promise<void>;
}

/**
 * The top of the profile, laid out like Instagram/Facebook profiles: a cover made from the
 * student's own photo (blurred, so it always matches), the photo itself large and sharp on top of
 * it, and a pencil that opens one sheet for viewing, replacing or resetting the photo.
 */
export function ProfileHero({ name, rollNumber, pictureUrl, hasUploadedPicture, canEdit, semesterLabel, onPhotoChanged }: ProfileHeroProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [picked, setPicked] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const photo = pictureUrl || DEFAULT_AVATAR;

  const choosePhoto = () => {
    setSheetOpen(false);
    setViewerOpen(false);
    // Opened after the sheet closes so mobile browsers treat it as part of the tap.
    fileInput.current?.click();
  };

  const savePhoto = async (blob: Blob) => {
    setSaving(true);
    try {
      await uploadProfilePicture(blob);
      await onPhotoChanged();
      setPicked(null);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload the photo");
    } finally {
      setSaving(false);
    }
  };

  const resetPhoto = async () => {
    setSheetOpen(false);
    setSaving(true);
    try {
      await removeProfilePicture();
      await onPhotoChanged();
      toast.success("Back to your Google photo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove the photo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.8)]">
      {/* Cover: the photo itself, blurred and darkened, fading into the card. */}
      <div className="relative h-32 overflow-hidden">
        <img src={photo} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-150 object-cover opacity-70 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-neutral-950" />
      </div>

      <div className="relative -mt-16 flex flex-col items-center px-5 pb-5 text-center">
        <div className="relative">
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            aria-label="View profile photo"
            className="block rounded-full bg-gradient-to-tr from-primary via-violet-500 to-sky-400 p-[3px] shadow-2xl transition active:scale-[0.97] touch-manipulation"
          >
            <span className="relative block h-28 w-28 overflow-hidden rounded-full border-[3px] border-neutral-950 bg-neutral-800">
              <img
                src={photo}
                alt={name || "Profile"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              {saving && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <Loader2 className="h-7 w-7 animate-spin text-white" />
                </span>
              )}
            </span>
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              disabled={saving}
              aria-label="Edit profile photo"
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg ring-[3px] ring-neutral-950 transition active:scale-90 disabled:opacity-60 touch-manipulation"
            >
              <Pencil className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <h1 className="mt-3 max-w-full truncate text-[22px] font-bold tracking-tight text-white">{name}</h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {rollNumber && (
            <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/10">
              {rollNumber}
            </span>
          )}
          {semesterLabel === undefined ? (
            <span className="h-6 w-24 animate-pulse rounded-full bg-white/[0.06]" />
          ) : semesterLabel ? (
            <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-primary/40">
              {semesterLabel}
            </span>
          ) : null}
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // picking the same file again still fires
          if (file) setPicked(file);
        }}
      />

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="border-white/10 bg-neutral-950 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="flex flex-col items-center px-5 pt-4 pb-2">
            <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10" />
            <DrawerTitle className="mt-2 text-base font-semibold text-white">Profile photo</DrawerTitle>
            <p className="text-xs text-white/50">Shown to classmates in search and the assistant</p>
          </div>
          <div className="mx-4 mt-3 overflow-hidden rounded-2xl bg-white/[0.05]">
            <SheetAction icon={Eye} label="View photo" onClick={() => { setSheetOpen(false); setViewerOpen(true); }} />
            <SheetAction icon={ImagePlus} label={hasUploadedPicture ? "Choose a new photo" : "Upload a photo"} onClick={choosePhoto} />
            {hasUploadedPicture && <SheetAction icon={RotateCcw} label="Use my Google photo" onClick={resetPhoto} danger />}
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="mx-4 mt-3 h-12 rounded-2xl bg-white/[0.05] text-[15px] font-semibold text-white transition active:bg-white/10"
          >
            Cancel
          </button>
        </DrawerContent>
      </Drawer>

      <PhotoViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        src={pictureUrl}
        name={name}
        subtitle={rollNumber}
        actions={
          canEdit && (
            <button
              type="button"
              onClick={choosePhoto}
              className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-neutral-900 transition active:scale-95"
            >
              <Pencil className="h-4 w-4" strokeWidth={2.5} />
              Edit photo
            </button>
          )
        }
      />

      <PhotoCropper file={picked} saving={saving} onCancel={() => setPicked(null)} onSave={savePhoto} />
    </div>
  );
}

function SheetAction({ icon: Icon, label, onClick, danger }: { icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 w-full items-center gap-3.5 border-b border-white/[0.06] px-4 text-left text-[15px] font-medium transition last:border-b-0 active:bg-white/10",
        danger ? "text-red-400" : "text-white",
      )}
    >
      <Icon className="h-5 w-5 opacity-80" />
      {label}
    </button>
  );
}
