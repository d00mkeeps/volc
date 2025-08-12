// hooks/useImageUpload.ts
import { useState } from "react";
import { imageService } from "@/services/api/imageService";

export const useImageUpload = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);

  const testKnownImage = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[useImageUpload] Testing known image ID...");
      const result = await imageService.getImageUrl(
        "9f5e81bf-c216-4b04-b394-f25a039b0317"
      );
      console.log("[useImageUpload] Get URL result:", result);

      // ✅ Fix: Access nested data structure
      if (result.success && result.data?.url) {
        setImageUrl(result.data.url);
        setImageId("a80814ae-8b20-4c00-b72f-25f90ca1ed74");
        console.log("[useImageUpload] Image URL set:", result.data.url);
      } else {
        throw new Error(result.error || "Failed to get image URL");
      }
    } catch (err) {
      console.error("[useImageUpload] Error testing image:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (imageUri: string) => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    setImageId(null);

    try {
      console.log("[useImageUpload] Starting full upload flow...");

      // 1. Create temp image + get upload URL
      const tempResult = await imageService.createTempImage("jpg");
      if (!tempResult.success) {
        throw new Error(tempResult.error || "Failed to create temp image");
      }

      // ✅ Type guard to ensure values exist
      if (!tempResult.image_id || !tempResult.upload_url) {
        throw new Error("Missing image_id or upload_url in response");
      }

      const image_id = tempResult.image_id;
      const upload_url = tempResult.upload_url;
      console.log("[useImageUpload] Created temp image:", image_id);

      // 2. Upload to storage
      const uploadSuccess = await imageService.uploadImage(
        upload_url,
        imageUri
      );
      if (!uploadSuccess) {
        throw new Error("Failed to upload image");
      }
      console.log("[useImageUpload] Upload successful");

      // 3. Get view URL for display
      const urlResult = await imageService.getImageUrl(image_id);
      if (urlResult.success && urlResult.data?.url) {
        setImageUrl(urlResult.data.url);
        setImageId(image_id);
        console.log("[useImageUpload] Got view URL:", urlResult.data.url);
      } else {
        throw new Error("Failed to get image URL");
      }
      // 4. Commit image (make it permanent)
      await imageService.commitImage(image_id);
      console.log("[useImageUpload] Image committed");

      return image_id;
    } catch (err) {
      console.error("[useImageUpload] Upload flow error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImageUrl(null);
    setImageId(null);
    setError(null);
  };

  return {
    imageUrl,
    imageId,
    loading,
    error,
    testKnownImage,
    uploadImage,
    clearImage,
  };
};
