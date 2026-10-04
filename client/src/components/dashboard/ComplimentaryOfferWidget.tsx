import { useState, useRef, useEffect } from "react";
import { AppIcon } from "../ui/AppIcon";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { InputField, TextAreaField } from "../ui/FormField";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";
import { compressImage } from "../../utils/imageCompressor";
import { uploadToR2 } from "../../utils/r2Uploader";
import type { ComplimentaryOfferDetails, ComplimentaryOfferStatus } from "../../types";

interface ComplimentaryOfferWidgetProps {
  complimentaryOfferActive?: boolean;
  initialDetails?: ComplimentaryOfferDetails;
  onUpdated?: (details: ComplimentaryOfferDetails) => void;
}

const STATUS_CONFIG: Record<
  ComplimentaryOfferStatus,
  { label: string; badgeClass: string; description: string }
> = {
  pending_assets: {
    label: "Awaiting Brand Assets",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700",
    description: "Please submit your product images and brand details within 14 days so our creative team can produce your 2 Instagram Reels and launch your ₹500 Meta Ad campaign.",
  },
  assets_submitted: {
    label: "Assets Submitted · In Review",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700",
    description: "We have received your brand assets! Our creative team is reviewing your details to draft the reel concepts.",
  },
  in_production: {
    label: "In Production · Crafting Reels",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700",
    description: "Your 2 promotional reels are currently being edited and styled by the Zensos media team.",
  },
  reels_published: {
    label: "2 Reels Live on Instagram",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700",
    description: "Your brand feature reels are live on the official Zensos Instagram handle! Check the links below.",
  },
  ad_running: {
    label: "₹500 Meta Ad Campaign Live",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700",
    description: "Your ₹500 Meta Ad campaign is actively boosting your reels across Instagram & Facebook to drive awareness and store visits.",
  },
  completed: {
    label: "Offer Completed",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700",
    description: "Your complimentary 2 Reels and ₹500 Meta Ad boost have been fully delivered. Thank you for partnering with Zensos!",
  },
};

export function ComplimentaryOfferWidget({
  complimentaryOfferActive,
  initialDetails,
  onUpdated,
}: ComplimentaryOfferWidgetProps) {
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [details, setDetails] = useState<ComplimentaryOfferDetails>(initialDetails || {});
  const [socialHandle, setSocialHandle] = useState(initialDetails?.socialHandle || "");
  const [brandDescription, setBrandDescription] = useState(initialDetails?.brandDescription || "");
  const [uspHighlights, setUspHighlights] = useState(initialDetails?.uspHighlights || "");
  const [targetAudience, setTargetAudience] = useState(initialDetails?.targetAudience || "");
  const [additionalNotes, setAdditionalNotes] = useState(initialDetails?.additionalNotes || "");
  const [productImages, setProductImages] = useState<string[]>(initialDetails?.productImages || []);

  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (initialDetails) {
      setDetails(initialDetails);
      setSocialHandle(initialDetails.socialHandle || "");
      setBrandDescription(initialDetails.brandDescription || "");
      setUspHighlights(initialDetails.uspHighlights || "");
      setTargetAudience(initialDetails.targetAudience || "");
      setAdditionalNotes(initialDetails.additionalNotes || "");
      setProductImages(initialDetails.productImages || []);
      // If assets are not submitted yet, default expanded so seller sees the upload form easily
      if (!initialDetails.status || initialDetails.status === "pending_assets") {
        setIsExpanded(true);
      }
    }
  }, [initialDetails]);

  if (!complimentaryOfferActive) {
    return null;
  }

  const currentStatus: ComplimentaryOfferStatus = details.status || "pending_assets";
  const statusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending_assets;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (productImages.length >= 4) {
      showError("You can upload a maximum of 4 product images.");
      return;
    }

    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, 0.8, 1200, 1200, false);
      const { url } = await uploadToR2({
        file: compressed,
        folder: "offer-assets",
        isPrivate: false,
      });
      setProductImages((prev) => [...prev, url]);
      showSuccess("Image uploaded successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      showError(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveImage(indexToRemove: number) {
    setProductImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        socialHandle: socialHandle.trim(),
        brandDescription: brandDescription.trim(),
        uspHighlights: uspHighlights.trim(),
        targetAudience: targetAudience.trim(),
        additionalNotes: additionalNotes.trim(),
        productImages,
      };

      const res = await api.post<{ message: string; details: ComplimentaryOfferDetails }>(
        "/subscriptions/complimentary-offer/assets",
        payload
      );

      setDetails(res.data.details);
      onUpdated?.(res.data.details);
      showSuccess("Brand assets submitted for review!");
      setIsExpanded(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit brand assets";
      showError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden border-2 border-teal-500/30 bg-gradient-to-br from-teal-50/50 via-white to-sky-50/40 p-4 sm:p-6 shadow-sm dark:from-teal-950/20 dark:via-slate-900 dark:to-sky-950/20">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm">
              🎁 Partner Spotlight Offer
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            2 Brand Feature Reels + ₹500 Meta Ad Campaign
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {statusMeta.description}
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start shrink-0 font-semibold px-3 py-1.5 text-xs"
        >
          {isExpanded ? "Collapse Form" : productImages.length > 0 ? "Edit Submitted Assets" : "Submit Assets"}
        </Button>
      </div>

      {/* Published Links Preview (If Live) */}
      {(details.reel1Url || details.reel2Url || details.metaAdCampaignId) && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            🎉 Live Campaign Links & Delivery
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
            {details.reel1Url && (
              <a
                href={details.reel1Url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <AppIcon name="instagram" className="text-[16px]" />
                Reel #1: View on Instagram ↗
              </a>
            )}
            {details.reel2Url && (
              <a
                href={details.reel2Url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <AppIcon name="instagram" className="text-[16px]" />
                Reel #2: View on Instagram ↗
              </a>
            )}
            {details.metaAdCampaignId && (
              <div className="col-span-full text-slate-600 dark:text-slate-300">
                <span className="font-semibold">Meta Campaign ID:</span> {details.metaAdCampaignId} ·{" "}
                <span className="font-semibold">Ad Spend:</span> ₹{details.metaAdSpend || 500}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Asset Submission Form */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t border-slate-200/80 pt-5 dark:border-slate-800">
          <div className="rounded-xl bg-teal-500/10 p-3 text-xs text-teal-900 dark:text-teal-200">
            <strong>📋 Requirements:</strong> Submit 1 to 4 clear product photos, your Instagram handle, and core USPs. Our video creators will remotely produce 2 high-converting reels on the official @zensos handle and run ₹500 targeted Meta ads.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Brand Instagram Handle"
              placeholder="@yourbrand"
              value={socialHandle}
              onChange={(e) => setSocialHandle(e.target.value)}
              hint="We will tag and mention your brand in the reels"
              required
            />
            <InputField
              label="Target Audience & Cities"
              placeholder="e.g. Women 22-45 in Bangalore, Hyderabad, Chennai"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              hint="Helps optimize your ₹500 Meta Ad campaign"
            />
          </div>

          <TextAreaField
            multiline={true}
            label="Key Brand USPs & Reel Storyline"
            placeholder="e.g. 100% natural, hand-poured soy candles with 40h burn time. Focus on relaxation and gift packaging."
            value={uspHighlights}
            onChange={(e) => setUspHighlights(e.target.value)}
            rows={3}
            hint="Highlight what makes your product unique for the video hook"
            required
          />

          <TextAreaField
            multiline={true}
            label="Additional Notes / Guidelines (Optional)"
            placeholder="Any specific phrases to include, brand vibe, or product launch timing..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={2}
          />

          {/* Product Images Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Product Images / Brand Assets ({productImages.length}/4)
            </label>
            <div className="flex flex-wrap gap-3">
              {productImages.map((imgUrl, index) => (
                <div
                  key={index}
                  className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <img src={imgUrl} alt={`Asset ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white opacity-90 transition hover:opacity-100 shadow-sm"
                    title="Remove image"
                  >
                    <AppIcon name="close" className="text-[12px]" />
                  </button>
                </div>
              ))}

              {productImages.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 text-teal-700 transition hover:border-teal-500 hover:bg-teal-50 dark:border-teal-700 dark:bg-teal-950/20 dark:text-teal-300"
                >
                  {uploadingImage ? (
                    <span className="text-[10px] font-semibold">Uploading...</span>
                  ) : (
                    <>
                      <AppIcon name="upload" className="text-[20px]" />
                      <span className="text-[10px] font-bold mt-1">+ Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsExpanded(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving} disabled={saving || uploadingImage}>
              <AppIcon name="check" className="text-[16px]" />
              {productImages.length > 0 || uspHighlights ? "Save & Submit Assets" : "Submit Assets"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
