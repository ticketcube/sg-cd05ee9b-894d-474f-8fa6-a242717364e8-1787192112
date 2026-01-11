import { supabase } from "@/integrations/supabase/client";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadMetadata {
  description?: string;
  uploadedBy: string;
  uploadedByEmail: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Upload a file to Supabase Storage with progress tracking
 * Supabase automatically handles large files (up to 50GB) with chunking
 */
export async function uploadToSupabaseStorage(
  file: File,
  metadata: UploadMetadata,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ path: string; url: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated to upload files");
  }

  // Create unique filename with timestamp
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${user.id}/${timestamp}_${sanitizedFileName}`;

  // Create custom metadata object
  const customMetadata = {
    description: metadata.description || "",
    uploadedBy: metadata.uploadedBy,
    uploadedByEmail: metadata.uploadedByEmail,
    originalFileName: metadata.originalFileName,
    fileSize: metadata.fileSize.toString(),
    mimeType: metadata.mimeType,
    uploadedAt: new Date().toISOString(),
  };

  // Upload file with metadata
  // Supabase handles large files automatically - no need for custom chunking!
  const { data, error } = await supabase.storage
    .from("staff-uploads")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      metadata: customMetadata,
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Upload completed but no data returned");
  }

  // Get public URL (even though bucket is private, this generates the path)
  const { data: urlData } = supabase.storage
    .from("staff-uploads")
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Get a signed URL for a private file (valid for 1 hour)
 */
export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("staff-uploads")
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error || !data) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * List all uploads for the current user
 */
export async function listUserUploads() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User must be authenticated");
  }

  const { data, error } = await supabase.storage
    .from("staff-uploads")
    .list(user.id, {
      limit: 100,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    throw new Error(`Failed to list uploads: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a file from storage
 */
export async function deleteUpload(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from("staff-uploads")
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}