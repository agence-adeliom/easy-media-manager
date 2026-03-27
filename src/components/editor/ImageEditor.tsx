import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cropper, ImageRestriction, RectangleStencil, type CropperRef } from "react-advanced-cropper";
import {
  Crop,
  FlipHorizontal,
  FlipVertical,
  Move,
  RotateCcw,
  RotateCw,
  Save,
  Undo2,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";

import { easyMediaClient } from "@/api/client";
import { ModalShell } from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/Button";
import { CORE_MODAL_IDS } from "@/lib/modal-ids";
import { useMediaStore } from "@/store/media-store";
import { isMediaFile } from "@/types/media";
import "react-advanced-cropper/dist/style.css";

type EditorMode = "move" | "crop";

interface EditorSnapshot {
  coordinates: ReturnType<CropperRef["getCoordinates"]>;
  transforms: ReturnType<CropperRef["getTransforms"]>;
}

function normalizeNumber(value: number) {
  return Math.round(value * 100) / 100;
}

function serializeSnapshot(snapshot: EditorSnapshot | null) {
  if (snapshot === null) {
    return "null";
  }

  return JSON.stringify({
    coordinates: snapshot.coordinates
      ? {
          left: normalizeNumber(snapshot.coordinates.left),
          top: normalizeNumber(snapshot.coordinates.top),
          width: normalizeNumber(snapshot.coordinates.width),
          height: normalizeNumber(snapshot.coordinates.height),
        }
      : null,
    transforms: {
      rotate: normalizeNumber(snapshot.transforms.rotate),
      flip: {
        horizontal: snapshot.transforms.flip.horizontal,
        vertical: snapshot.transforms.flip.vertical,
      },
    },
  });
}

function getSnapshot(cropper: CropperRef): EditorSnapshot {
  return {
    coordinates: cropper.getCoordinates(),
    transforms: cropper.getTransforms(),
  };
}

export function ImageEditor() {
  const routes = useMediaStore((state) => state.routes);
  const activeModal = useMediaStore((state) => state.activeModal);
  const closeModal = useMediaStore((state) => state.closeModal);
  const selectedFile = useMediaStore((state) => state.selectedFile);
  const currentFolderId = useMediaStore((state) => state.currentFolderId);
  const cropperRef = useRef<CropperRef>(null);
  const initialSnapshotRef = useRef<EditorSnapshot | null>(null);
  const [mode, setMode] = useState<EditorMode>("move");
  const [hasChanges, setHasChanges] = useState(false);
  const [hasCropSelection, setHasCropSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeModal !== CORE_MODAL_IDS.editor || selectedFile === null || !isMediaFile(selectedFile)) {
      initialSnapshotRef.current = null;
      setMode("move");
      setHasChanges(false);
      setHasCropSelection(false);
      setError(null);
    }
  }, [activeModal, selectedFile]);

  const syncSnapshot = (cropper: CropperRef) => {
    const snapshot = getSnapshot(cropper);
    const serializedSnapshot = serializeSnapshot(snapshot);

    if (initialSnapshotRef.current === null) {
      initialSnapshotRef.current = snapshot;
    }

    setHasCropSelection(snapshot.coordinates !== null);
    setHasChanges(serializedSnapshot !== serializeSnapshot(initialSnapshotRef.current));
  };

  const ensureSelectionForSave = (cropper: CropperRef) => {
    if (cropper.getCoordinates() !== null) {
      return;
    }

    const state = cropper.getState();

    if (!state) {
      throw new Error("Impossible de recuperer l'etat de l'image.");
    }

    cropper.setCoordinates({
      left: 0,
      top: 0,
      width: state.imageSize.width,
      height: state.imageSize.height,
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!routes?.uploadCropped || selectedFile === null || !isMediaFile(selectedFile)) {
        throw new Error("Edition impossible.");
      }

      const cropper = cropperRef.current;

      if (!cropper) {
        throw new Error("Editeur indisponible.");
      }

      ensureSelectionForSave(cropper);

      const dataUrl = cropper.getCanvas({
        fillColor: selectedFile.type.includes("png") ? "transparent" : "#fff",
        imageSmoothingQuality: "high",
      })?.toDataURL(selectedFile.type);

      if (!dataUrl) {
        throw new Error("Impossible de generer l'image recadree.");
      }

      return easyMediaClient.uploadCropped(routes.uploadCropped, {
        data: dataUrl,
        folder: currentFolderId,
        mime_type: selectedFile.type,
        name: selectedFile.name,
      });
    },
    onSuccess: async () => {
      if (cropperRef.current) {
        initialSnapshotRef.current = getSnapshot(cropperRef.current);
        setHasChanges(false);
      }

      await queryClient.invalidateQueries({ queryKey: ["files"] });
      closeModal();
      toast.success("Image enregistree.");
    },
    onError: (caughtError) => {
      const message = caughtError instanceof Error ? caughtError.message : "Erreur inconnue.";
      setError(message);
      toast.error(message);
    },
  });

  const handleCropperChange = (cropper: CropperRef) => {
    syncSnapshot(cropper);
  };

  const handleModeChange = (nextMode: EditorMode) => {
    setMode(nextMode);
  };

  const handleClear = () => {
    const cropper = cropperRef.current;

    if (!cropper) {
      return;
    }

    cropper.setCoordinates(null);
    syncSnapshot(cropper);
  };

  const handleReset = () => {
    const cropper = cropperRef.current;

    if (!cropper) {
      return;
    }

    cropper.reset();

    if (initialSnapshotRef.current?.coordinates === null) {
      cropper.setCoordinates(null);
    }

    setMode("move");
    syncSnapshot(cropper);
  };

  if (activeModal !== CORE_MODAL_IDS.editor || selectedFile === null || !isMediaFile(selectedFile)) {
    return null;
  }

  return (
    <ModalShell onClose={closeModal} open title={`Edition: ${selectedFile.name}`} widthClassName="max-w-6xl">
      <div className="flex flex-col gap-4">
        <div className="h-[60vh] overflow-hidden rounded-2xl bg-slate-950 p-3">
          <Cropper
            backgroundClassName="bg-slate-950"
            boundaryClassName="bg-slate-950"
            className="h-full w-full"
            imageRestriction={ImageRestriction.stencil}
            onChange={handleCropperChange}
            ref={cropperRef}
            src={selectedFile.path}
            stencilComponent={RectangleStencil}
            stencilProps={{
              movable: mode === "crop",
              resizable: mode === "crop",
              handlers: mode === "crop" ? undefined : {},
              lines: mode === "crop" ? undefined : {},
            }}
            transitions={false}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleModeChange("move")} type="button" variant={mode === "move" ? "primary" : "secondary"}>
            <Move className="mr-2 h-4 w-4" />
            Deplacer
          </Button>
          <Button onClick={() => handleModeChange("crop")} type="button" variant={mode === "crop" ? "primary" : "secondary"}>
            <Crop className="mr-2 h-4 w-4" />
            Recadrer
          </Button>
          <Button onClick={() => cropperRef.current?.zoomImage(1.1)} type="button">
            <ZoomIn className="mr-2 h-4 w-4" />
            Zoom +
          </Button>
          <Button onClick={() => cropperRef.current?.zoomImage(0.9)} type="button">
            <ZoomOut className="mr-2 h-4 w-4" />
            Zoom -
          </Button>
          <Button onClick={() => cropperRef.current?.rotateImage(45)} type="button">
            <RotateCw className="mr-2 h-4 w-4" />
            Rotation +
          </Button>
          <Button onClick={() => cropperRef.current?.rotateImage(-45)} type="button">
            <RotateCcw className="mr-2 h-4 w-4" />
            Rotation -
          </Button>
          <Button onClick={() => cropperRef.current?.flipImage(true, false)} type="button">
            <FlipHorizontal className="mr-2 h-4 w-4" />
            Flip H
          </Button>
          <Button onClick={() => cropperRef.current?.flipImage(false, true)} type="button">
            <FlipVertical className="mr-2 h-4 w-4" />
            Flip V
          </Button>
          <Button disabled={!hasCropSelection} onClick={handleClear} type="button" variant="ghost">
            <XCircle className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button disabled={!hasChanges} onClick={handleReset} type="button" variant="ghost">
            <Undo2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button disabled={mutation.isPending || !hasChanges} onClick={() => mutation.mutate()} type="button" variant="primary">
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </ModalShell>
  );
}
