import { api } from "../api/client";

interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  isPrivate: boolean;
  bucketName: string;
}

interface UploadOptions {
  file: File;
  folder?: string;
  isPrivate?: boolean;
  onProgress?: (percent: number) => void;
}

/**
 * Upload a file directly to Cloudflare R2 via presigned URL.
 */
export async function uploadToR2({
  file,
  folder = "uploads",
  isPrivate = false,
  onProgress,
}: UploadOptions): Promise<{ url: string; key: string }> {
  // 1. Get presigned PUT URL from our server
  const presignRes = await api.post<PresignedUrlResponse>("/upload/presigned-url", {
    folder,
    fileName: file.name,
    fileType: file.type || "image/jpeg",
    isPrivate,
  });

  const { uploadUrl, key, publicUrl } = presignRes.data;

  // 2. Upload file binary directly to Cloudflare R2
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status code ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error uploading file to Cloudflare R2"));
    };

    xhr.send(file);
  });

  return {
    url: publicUrl || key,
    key,
  };
}

/**
 * Delete a file from Cloudflare R2 storage by its key.
 */
export async function deleteFromR2(key: string, isPrivate = false): Promise<boolean> {
  if (!key) return false;
  try {
    const response = await api.delete("/upload/file", {
      data: { key, isPrivate },
    });
    return response.data?.success || false;
  } catch (err) {
    console.error("Failed to delete R2 file:", err);
    return false;
  }
}
