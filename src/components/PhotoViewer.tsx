import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const DEFAULT_AVATAR = "/user-icons/user2.png";

interface PhotoViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src?: string | null;
  name?: string | null;
  subtitle?: string | null;
}

/** A profile photo shown large, the way messaging apps open a contact's picture on tap. */
export function PhotoViewer({ open, onOpenChange, src, name, subtitle }: PhotoViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,420px)] max-w-none gap-0 overflow-hidden rounded-2xl border-white/10 bg-neutral-950 p-0">
        <DialogTitle className="sr-only">{name ? `${name}'s photo` : "Profile photo"}</DialogTitle>
        <img
          src={src || DEFAULT_AVATAR}
          alt={name || "Profile photo"}
          className="aspect-square w-full bg-neutral-900 object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_AVATAR;
          }}
        />
        {(name || subtitle) && (
          <div className="px-4 py-3">
            {name && <p className="truncate text-base font-semibold text-white">{name}</p>}
            {subtitle && <p className="truncate text-xs text-white/55">{subtitle}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
