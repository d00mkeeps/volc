import { supabase } from "@/lib/supabaseClient";
import { BaseApiService } from "./baseService";

export interface UploadUrlResponse {
  success: boolean;
  upload_url?: string;
  file_path?: string;
  expires_in?: number;
  error?: string;
}

export interface TempImageResponse {
  success: boolean;
  image_id?: string;
  upload_url?: string;
  file_path?: string;
  expires_in?: number;
  error?: string | null;
}

export interface CommitImageResponse {
  success: boolean;
  error?: string;
}

export interface ImageUrlResponse {
  data: any;
  success: boolean;
  url?: string;
  error?: string;
}

export interface DeleteImageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class ImageService extends BaseApiService {
  constructor() {
    super("/images");
  }

  // New TTL methods
  /**
   * Create temporary image record and get upload URL
   */
  async createTempImage(
    fileExtension: string = "jpg"
  ): Promise<TempImageResponse> {
    try {
      console.log(
        `[ImageService] Creating temp image for .${fileExtension} file`
      );
      const response = await this.post<{
        success: boolean;
        data: TempImageResponse;
        error: string | null;
      }>("/temp-upload", {
        file_extension: fileExtension,
      });

      console.log("[ImageService] Temp image created:", response.success);

      // Return the flattened structure that matches TempImageResponse
      return {
        success: response.success,
        image_id: response.data?.image_id,
        upload_url: response.data?.upload_url,
        file_path: response.data?.file_path,
        error: response.error,
      };
    } catch (error) {
      console.error("[ImageService] Error creating temp image:", error);
      return this.handleError(error);
    }
  }
  /**
   * Commit temporary image to permanent status
   */
  async commitImage(imageId: string): Promise<CommitImageResponse> {
    try {
      console.log(`[ImageService] Committing image: ${imageId}`);
      const response = await this.post<CommitImageResponse>(
        `/${imageId}/commit`,
        {}
      );
      console.log("[ImageService] Image committed:", response.success);
      return response;
    } catch (error) {
      console.error("[ImageService] Error committing image:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get public URL for image by ID
   */
  async getImageUrl(imageId: string): Promise<ImageUrlResponse> {
    try {
      console.log(`[ImageService] Getting URL for image: ${imageId}`);
      const response = await this.get<ImageUrlResponse>(`/${imageId}/url`);
      console.log("[ImageService] Got image URL:", response.success);
      return response;
    } catch (error) {
      console.error("[ImageService] Error getting image URL:", error);
      return this.handleError(error);
    }
  }

  // Existing methods (keeping for backward compatibility)
  /**
   * Get a signed upload URL for direct upload to Supabase storage
   * (Legacy method - consider migrating to createTempImage)
   */
  async getUploadUrl(
    fileExtension: string = "jpg",
    folder: string = "workouts"
  ): Promise<UploadUrlResponse> {
    try {
      console.log(
        `[ImageService] Requesting upload URL for .${fileExtension} file`
      );
      const response = await this.post<UploadUrlResponse>("/upload-url", {
        file_extension: fileExtension,
        folder: folder,
      });
      console.log("[ImageService] Upload URL received:", response.success);
      return response;
    } catch (error) {
      console.error("[ImageService] Error getting upload URL:", error);
      return this.handleError(error);
    }
  }

  /**
   * Upload image directly to Supabase storage using signed URL
   */
  // /services/api/imageService.ts - uploadImage method
  // /services/api/imageService.ts - uploadImage method
  async uploadImage(uploadUrl: string, imageUri: string): Promise<boolean> {
    try {
      console.log("[ImageService] Starting direct upload to Supabase");
      console.log("[ImageService] Upload URL:", uploadUrl);
      console.log("[ImageService] Image URI:", imageUri);

      // ✅ FIX: Use FormData instead of fetch() for local files
      const filename = imageUri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      // Get token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: formData,
        headers: {
          "Content-Type": type,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      console.log(
        "[ImageService] Upload response status:",
        uploadResponse.status
      );

      const responseText = await uploadResponse.text();
      console.log("[ImageService] Upload response body:", responseText);

      if (!uploadResponse.ok) {
        throw new Error(
          `Upload failed: ${uploadResponse.status} ${responseText}`
        );
      }

      console.log("[ImageService] Upload successful");
      return true;
    } catch (error) {
      console.error("[ImageService] Upload error:", error);
      return false;
    }
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(imagePath: string): Promise<DeleteImageResponse> {
    try {
      console.log(`[ImageService] Deleting image: ${imagePath}`);
      const response = await this.delete<DeleteImageResponse>(`/${imagePath}`);
      console.log("[ImageService] Delete response:", response.success);
      return response;
    } catch (error) {
      console.error("[ImageService] Error deleting image:", error);
      return this.handleError(error);
    }
  }

  /**
   * Get public URL for an image (legacy method using path)
   */
  getPublicUrl(imagePath: string): string {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/images/${imagePath}`;
  }
}

export const imageService = new ImageService();
function getFreshToken() {
  throw new Error("Function not implemented.");
}
