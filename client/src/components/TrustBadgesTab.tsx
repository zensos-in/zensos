import React, { useState, useRef, type DragEvent } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AppIcon } from "./ui/AppIcon";
import { compressImage } from "../utils/imageCompressor";
import { uploadToR2 } from "../utils/r2Uploader";
import {
  PREDEFINED_BADGES,
  generateMakeInIndiaBadge,
  generateSecuredCheckoutBadge,
  generateCodAvailableBadge,
  generateFreeShippingBadge,
  generateFssaiBadge,
} from "../utils/predefinedBadges";
import type { TrustBadge } from "../types";

const MAX_TRUST_BADGES = 10;

// Normalize image URLs for preview
function normalizeImageUrl(url: string) {
  if (!url) return "";
  return url.trim();
}

interface TrustBadgesTabProps {
  initialBadges?: TrustBadge[];
  onSaveSuccess?: () => void;
}

export function TrustBadgesTab({ initialBadges = [], onSaveSuccess }: TrustBadgesTabProps) {
  const { refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [badges, setBadges] = useState<TrustBadge[]>(initialBadges);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // FSSAI license number state
  const [fssaiLicenseNumber, setFssaiLicenseNumber] = useState("");

  // Manual URL input form
  const [manualUrl, setManualUrl] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Drag & drop sorting state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when initialBadges change
  React.useEffect(() => {
    setBadges(initialBadges || []);
  }, [initialBadges]);

  function getPredefinedBadgeUrl(type: string, licNumber = fssaiLicenseNumber): string {
    switch (type) {
      case "make_in_india":
        return generateMakeInIndiaBadge();
      case "secured_checkout":
        return generateSecuredCheckoutBadge();
      case "cod_available":
        return generateCodAvailableBadge();
      case "free_shipping":
        return generateFreeShippingBadge();
      case "fssai":
        return generateFssaiBadge(licNumber);
      default:
        return "";
    }
  }

  function handleAddPredefinedBadge(type: string) {
    if (badges.length >= MAX_TRUST_BADGES) {
      showError(`Maximum limit of ${MAX_TRUST_BADGES} trust badges reached.`);
      return;
    }

    const badgeUrl = getPredefinedBadgeUrl(type, fssaiLicenseNumber);
    if (!badgeUrl) return;

    // If already added, prevent duplicate
    const isAlreadyPresent = badges.some(b => b.imageUrl === badgeUrl);
    if (isAlreadyPresent) {
      showError("This badge is already in your trust badges list.");
      return;
    }

    setBadges(prev => [...prev, { imageUrl: badgeUrl }]);
    showSuccess("Predefined badge added to your list. Click 'Save Trust Badges' to publish.");
  }

  async function processAndUploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      showError("Please select valid image files (PNG, JPG, WEBP, SVG).");
      return;
    }

    const availableSlots = MAX_TRUST_BADGES - badges.length;
    if (availableSlots <= 0) {
      showError(`Maximum limit of ${MAX_TRUST_BADGES} trust badges reached.`);
      return;
    }

    const filesToUpload = fileArray.slice(0, availableSlots);
    if (fileArray.length > availableSlots) {
      showError(`Only ${availableSlots} more badge${availableSlots > 1 ? "s" : ""} can be added.`);
    }

    setUploadingCount(filesToUpload.length);
    setUploadProgress(0);

    const uploadedBadges: TrustBadge[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        // Optimize image (keep PNG transparency, max width/height 1000px, 85% quality)
        const isPng = file.type === "image/png";
        const compressed = await compressImage(file, 0.85, 1000, 1000, isPng);

        const { url } = await uploadToR2({
          file: compressed,
          folder: "trust-badges",
          onProgress: (percent) => {
            const overallProgress = Math.round(((i + percent / 100) / filesToUpload.length) * 100);
            setUploadProgress(overallProgress);
          },
        });

        uploadedBadges.push({
          imageUrl: url,
        });
      } catch (err: any) {
        console.error("Failed to upload trust badge:", err);
        showError(`Failed to upload "${file.name}": ${err?.message || "Upload error"}`);
      }
    }

    if (uploadedBadges.length > 0) {
      setBadges(prev => [...prev, ...uploadedBadges].slice(0, MAX_TRUST_BADGES));
      showSuccess(`Added ${uploadedBadges.length} trust badge${uploadedBadges.length > 1 ? "s" : ""}. Click "Save Trust Badges" to publish.`);
    }

    setUploadingCount(0);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      void processAndUploadFiles(e.target.files);
    }
  }

  function handleDropzoneDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOverDropzone(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processAndUploadFiles(e.dataTransfer.files);
    }
  }

  function handleAddManualBadge() {
    if (!manualUrl.trim()) return;
    if (badges.length >= MAX_TRUST_BADGES) {
      showError(`Maximum ${MAX_TRUST_BADGES} trust badges allowed.`);
      return;
    }
    setBadges(prev => [
      ...prev,
      { imageUrl: manualUrl.trim() },
    ]);
    setManualUrl("");
    setShowManualInput(false);
  }

  function handleRemoveBadge(index: number) {
    setBadges(prev => prev.filter((_, i) => i !== index));
  }

  function moveBadge(from: number, to: number) {
    if (to < 0 || to >= badges.length) return;
    setBadges(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  // Drag and drop reordering
  function handleDragStart(index: number) {
    setDraggedIndex(index);
    setDragOverIndex(index);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  }

  function handleDrop(index: number) {
    if (draggedIndex !== null && draggedIndex !== index) {
      moveBadge(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await api.put("/store/options", {
        trustBadges: badges.map(b => ({
          imageUrl: b.imageUrl.trim(),
        })),
      });
      await refreshProfile();
      showSuccess("Trust badges saved successfully!");
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      console.error(err);
      showError(err?.response?.data?.message || "Failed to save trust badges.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="mx-auto max-w-5xl space-y-4 sm:space-y-6 px-1 sm:px-0">
      {/* Header Card */}
      <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 p-4 sm:p-7 shadow-card dark:border-teal-900/35 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-300">
              <AppIcon name="badge" className="text-sm" />
              <span>Storefront Trust Badges</span>
            </div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
              Trust Badges &amp; Quality Assurances
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm max-w-2xl">
              Select from ready-made badges (Make In India, Secured Checkout, COD, Free Shipping, FSSAI with license) or upload custom square &amp; rectangle images.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:items-end">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Badge Capacity</span>
              <span className={`text-sm sm:text-base font-extrabold ${badges.length >= MAX_TRUST_BADGES ? "text-amber-600 dark:text-amber-400" : "text-slate-800 dark:text-slate-200"}`}>
                {badges.length} / {MAX_TRUST_BADGES}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || uploadingCount > 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#ff751f] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[#ff8c3a] hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none active:scale-95"
            >
              <AppIcon name="save" className="text-sm sm:text-base" />
              <span>{isSaving ? "Saving..." : "Save Badges"}</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-2.5 rounded-2xl border border-teal-100 bg-white/80 p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-400 text-xs font-bold">
              🌟
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Predefined Badges</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Make In India, Secured Checkout, COD, Free Shipping &amp; FSSAI.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-teal-100 bg-white/80 p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-400 text-xs font-bold">
              📐
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Custom Uploads</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Upload your own Square or Rectangle images (optimized to Cloudflare).</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-teal-100 bg-white/80 p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 text-xs font-bold">
              ✨
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto-Scrolling Carousel</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Displays in a seamless infinite marquee on your public store.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: PREDEFINED TRUST BADGES ── */}
      <div className="rounded-3xl border border-white/70 bg-white/90 p-4 sm:p-7 shadow-card dark:border-teal-900/35 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              One-Click Library
            </span>
            <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Predefined Trust Badges
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click &ldquo;+ Add to Badges&rdquo; to add standard trust marks to your store.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {PREDEFINED_BADGES.map((item) => {
            const previewUrl = getPredefinedBadgeUrl(item.badgeType, fssaiLicenseNumber);
            const isAlreadyAdded = badges.some(b => b.imageUrl === previewUrl);

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 transition-all ${
                  isAlreadyAdded
                    ? "border-teal-300 bg-teal-50/30 dark:border-teal-800 dark:bg-teal-950/20"
                    : "border-slate-200 bg-slate-50/50 hover:border-teal-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700"
                }`}
              >
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Badge Preview Box */}
                  <div className="flex h-16 sm:h-20 w-full items-center justify-center rounded-xl border border-slate-200/80 bg-white p-1.5 sm:p-2 shadow-xs dark:border-slate-700 dark:bg-slate-900/90">
                    <img
                      src={previewUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{item.icon}</span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </h4>
                    </div>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  {/* FSSAI License Number Input */}
                  {item.hasInput && (
                    <div className="pt-1 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>{item.inputLabel}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                      </label>
                      <input
                        type="text"
                        placeholder={item.inputPlaceholder}
                        value={fssaiLicenseNumber}
                        maxLength={16}
                        onChange={(e) => setFssaiLicenseNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Vector SVG • High-DPI
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPredefinedBadge(item.badgeType)}
                    disabled={badges.length >= MAX_TRUST_BADGES && !isAlreadyAdded}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-bold transition ${
                      isAlreadyAdded
                        ? "border border-teal-300 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"
                        : "bg-teal-600 text-white hover:bg-teal-700 shadow-xs active:scale-95 disabled:opacity-50"
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <span>✓ Added</span>
                      </>
                    ) : (
                      <>
                        <span>+ Add to Badges</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: CUSTOM IMAGE UPLOAD ── */}
      <div className="rounded-3xl border border-white/70 bg-white/90 p-4 sm:p-7 shadow-card dark:border-teal-900/35 dark:bg-slate-900">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Custom Badges
            </span>
            <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Upload Your Own Badge Images
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowManualInput(prev => !prev)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 transition"
          >
            {showManualInput ? "Hide Direct URL input" : "+ Add image via URL"}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={badges.length >= MAX_TRUST_BADGES || uploadingCount > 0}
        />

        {/* Drag & drop upload box */}
        {badges.length < MAX_TRUST_BADGES ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOverDropzone(true); }}
            onDragLeave={() => setIsDragOverDropzone(false)}
            onDrop={handleDropzoneDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 sm:p-8 text-center transition-all ${
              isDragOverDropzone
                ? "border-teal-500 bg-teal-50/50 dark:border-teal-400 dark:bg-teal-950/30 ring-4 ring-teal-100 dark:ring-teal-900/40"
                : "border-slate-300/80 bg-slate-50/60 hover:border-teal-400 hover:bg-teal-50/20 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-teal-500"
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 shadow-sm">
                <AppIcon name="upload" className="text-lg sm:text-xl" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Click to browse or drag &amp; drop badge images here
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  PNG with transparency, JPG, or WEBP. Square or Rectangle. Up to {MAX_TRUST_BADGES - badges.length} more.
                </p>
              </div>

              {uploadingCount > 0 && (
                <div className="w-full max-w-xs space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-teal-700 dark:text-teal-400">
                    <span>Optimizing &amp; Uploading to Cloudflare...</span>
                    <span>{uploadProgress ?? 0}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full bg-teal-600 transition-all duration-200"
                      style={{ width: `${uploadProgress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-center text-xs sm:text-sm font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            Maximum limit of {MAX_TRUST_BADGES} badges reached. Remove an existing badge to add a new one.
          </div>
        )}

        {/* Optional Manual URL Input */}
        {showManualInput && badges.length < MAX_TRUST_BADGES && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Add Badge via Image URL</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="url"
                placeholder="https://example.com/badge.png"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddManualBadge}
                disabled={!manualUrl.trim()}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700 disabled:opacity-50 shrink-0"
              >
                + Add Badge
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 3: MANAGE ACTIVE STORE BADGES ── */}
      <div className="rounded-3xl border border-white/70 bg-white/90 p-4 sm:p-7 shadow-card dark:border-teal-900/35 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Active Store Badges ({badges.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag badges or use arrows to rearrange the order they appear on your public store.
            </p>
          </div>
          {badges.length > 0 && (
            <button
              type="button"
              onClick={() => setBadges([])}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition self-start sm:self-auto"
            >
              Clear all badges
            </button>
          )}
        </div>

        {badges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center space-y-2">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center dark:bg-slate-800 dark:text-slate-500">
              <AppIcon name="badge" className="text-xl sm:text-2xl" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              No trust badges added yet
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              Select one of the predefined badges above or upload custom images to display trust marks on your storefront.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {badges.map((badge, index) => (
              <div
                key={`${badge.imageUrl.slice(0, 40)}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 rounded-2xl border p-2.5 sm:p-3 transition-all ${
                  dragOverIndex === index
                    ? "border-teal-400 ring-2 ring-teal-100 bg-teal-50/40 dark:bg-teal-950/30 dark:ring-teal-900/40"
                    : "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-800/60"
                } ${draggedIndex === index ? "opacity-40" : "opacity-100"}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Drag Handle & Position */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:text-slate-500 py-1 text-sm font-mono select-none">
                      ⋮⋮
                    </span>
                    <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {index + 1}
                    </span>
                  </div>

                  {/* Badge Thumbnail Preview */}
                  <div className="relative flex h-12 w-20 sm:h-14 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/80 shadow-xs">
                    <img
                      src={normalizeImageUrl(badge.imageUrl)}
                      alt={`Badge ${index + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      Badge #{index + 1}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">
                      {badge.imageUrl.startsWith("data:") ? "Predefined SVG" : "Custom Upload"}
                    </p>
                  </div>
                </div>

                {/* Reorder Buttons & Delete */}
                <div className="flex items-center justify-end gap-1 shrink-0 self-end xs:self-center border-t xs:border-t-0 pt-1.5 xs:pt-0 border-slate-100 dark:border-slate-800 w-full xs:w-auto">
                  <button
                    type="button"
                    onClick={() => moveBadge(index, index - 1)}
                    disabled={index === 0}
                    title="Move Left/Up"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition text-xs"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBadge(index, index + 1)}
                    disabled={index === badges.length - 1}
                    title="Move Right/Down"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition text-xs"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBadge(index)}
                    title="Remove badge"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 transition text-xs"
                  >
                    <AppIcon name="trash" className="text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 4: LIVE MARQUEE PREVIEW ── */}
      {badges.length > 0 && (
        <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 p-4 sm:p-7 shadow-card dark:border-teal-900/35 dark:from-slate-950 dark:to-slate-900">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Live Storefront Preview
              </span>
              <h3 className="font-heading text-xs sm:text-base font-bold text-slate-900 dark:text-slate-100">
                How it appears on your Public Store
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Hover to pause
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 py-3.5 sm:py-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-inner">
            {/* Subtle side fade overlays */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-8 sm:w-12 bg-gradient-to-r from-white dark:from-slate-900 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-8 sm:w-12 bg-gradient-to-l from-white dark:from-slate-900 to-transparent" />

            <div className="animate-trust-marquee items-center gap-6 sm:gap-14 px-3 sm:px-4">
              {/* Render badges twice for seamless infinite scrolling loop */}
              {[...badges, ...badges].map((b, i) => (
                <div
                  key={`preview-${i}`}
                  className="flex items-center justify-center shrink-0 px-1 sm:px-2 group"
                >
                  <img
                    src={normalizeImageUrl(b.imageUrl)}
                    alt="Trust Badge"
                    className="h-8 sm:h-12 md:h-14 w-auto max-w-[110px] sm:max-w-[170px] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || uploadingCount > 0}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff751f] px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#ff8c3a] hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none active:scale-95"
        >
          <AppIcon name="save" className="text-base" />
          <span>{isSaving ? "Saving..." : "Save Trust Badges"}</span>
        </button>
      </div>
    </article>
  );
}
