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
  error?: string;
}

export interface CommitImageResponse {
  success: boolean;
  error?: string;
}

export interface ImageUrlResponse {
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
      const response = await this.post<TempImageResponse>("/temp-upload", {
        file_extension: fileExtension,
      });
      console.log("[ImageService] Temp image created:", response.success);
      return response;
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
  async uploadImage(uploadUrl: string, imageUri: string): Promise<boolean> {
    try {
      console.log("[ImageService] Starting direct upload to Supabase");

      // Create form data for upload
      const formData = new FormData();
      // For Expo, we need to handle the file properly
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append("file", blob);

      // Upload directly to Supabase storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type, let the browser set it with boundary
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(
          `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`
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
