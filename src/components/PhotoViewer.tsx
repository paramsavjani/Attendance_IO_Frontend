import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const DEFAULT_AVATAR = "/user-icons/user2.png";

interface PhotoViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src?: string | null;
  name?: string | null;
  subtitle?: string | null;
  /** Buttons along the bottom edge, e.g. "Edit" on your own photo. */
  actions?: ReactNode;
}

/**
 * Full-screen photo, the way Instagram and WhatsApp open a profile picture: black backdrop, the
 * photo as large as the screen allows, who it is along the top, actions along the bottom.
 */
export function PhotoViewer({ open, onOpenChange, src, name, subtitle, actions }: PhotoViewerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[100] flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onClick={() => onOpenChange(false)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className="flex items-center gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top),16px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogPrimitive.Close
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-[15px] font-semibold text-white">
                {name || "Profile photo"}
              </DialogPrimitive.Title>
              {subtitle && <p className="truncate text-xs text-white/55">{subtitle}</p>}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center px-0 sm:px-6">
            <img
              src={src || DEFAULT_AVATAR}
              alt={name || "Profile photo"}
              onClick={(e) => e.stopPropagation()}
              className="aspect-square max-h-full w-full max-w-[min(100vw,560px)] select-none object-cover sm:rounded-2xl"
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          </div>

          <div
            className="flex min-h-[72px] items-center justify-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
