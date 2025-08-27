
import { useState } from "react";

export interface ChunkedUploadOptions {
  file: File;
  userName: string;
  description?: string;
  onProgress?: (progress: number) => void;
  onStatusUpdate?: (status: string) => void;
  chunkSize?: number;
}

export interface ChunkedUploadResult {
  success: boolean;
  assetId?: string;
  assetUrl?: string;
  error?: string;
}

export const useChunkedUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");

  const uploadFileChunked = async (options: ChunkedUploadOptions): Promise<ChunkedUploadResult> => {
    const {
      file,
      userName,
      description,
      onProgress,
      onStatusUpdate,
      chunkSize = 5 * 1024 * 1024 // 5MB default chunk size
    } = options;

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentStatus("Initializing upload...");
    onStatusUpdate?.("Initializing upload...");

    try {
      // Step 1: Start resumable upload session
      setCurrentStatus("Starting resumable session...");
      onStatusUpdate?.("Starting resumable session...");

      const startRes = await fetch("/api/brandfolder/upload?action=start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          userName: userName,
          description: description || "",
          fileSize: file.size
        })
      });

      if (!startRes.ok) {
        const errorData = await startRes.json();
        throw new Error(errorData.error || "Failed to start upload session");
      }

      const { resumableUploadUrl, objectUrl } = await startRes.json();

      // Step 2: Check if any bytes have been uploaded previously (resumability)
      setCurrentStatus("Checking upload status...");
      onStatusUpdate?.("Checking upload status...");

      let uploadedBytes = 0;
      try {
        const statusRes = await fetch("/api/brandfolder/upload?action=status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumableUploadUrl,
            fileSize: file.size
          })
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          uploadedBytes = statusData.uploadedBytes || 0;
        }
      } catch (statusError) {
        console.log("Status check failed, starting from beginning:", statusError);
        uploadedBytes = 0;
      }

      // Step 3: Upload file in chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      const startChunk = Math.floor(uploadedBytes / chunkSize);

      setCurrentStatus(`Uploading ${totalChunks} chunks...`);
      onStatusUpdate?.(`Uploading ${totalChunks} chunks...`);

      for (let chunkIndex = startChunk; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const isLastChunk = end === file.size;

        setCurrentStatus(`Uploading chunk ${chunkIndex + 1}/${totalChunks}...`);
        onStatusUpdate?.(`Uploading chunk ${chunkIndex + 1}/${totalChunks}...`);

        // Retry logic for each chunk
        let retries = 3;
        let chunkUploaded = false;

        while (retries > 0 && !chunkUploaded) {
          try {
            const chunkResponse = await fetch(resumableUploadUrl, {
              method: "PUT",
              headers: {
                "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
                "Content-Type": file.type
              },
              body: chunk
            });

            // Accept both 200 (final chunk) and 308 (resume incomplete) as success
            if (chunkResponse.ok || chunkResponse.status === 308) {
              chunkUploaded = true;
              uploadedBytes = end;

              // Update progress
              const progressPercent = (uploadedBytes / file.size) * 100;
              setUploadProgress(progressPercent);
              onProgress?.(progressPercent);

              // Log successful chunk upload
              console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully (${start}-${end - 1}/${file.size})`);

              // If this is the last chunk and we got 200, the upload is complete
              if (isLastChunk && chunkResponse.ok) {
                console.log("🎉 All chunks uploaded successfully!");
              }
            } else {
              throw new Error(`Chunk upload failed with status ${chunkResponse.status}: ${chunkResponse.statusText}`);
            }
          } catch (chunkError) {
            retries--;
            console.error(`❌ Chunk ${chunkIndex + 1} upload attempt failed:`, chunkError);

            if (retries === 0) {
              throw new Error(`Failed to upload chunk ${chunkIndex + 1} after 3 attempts: ${chunkError instanceof Error ? chunkError.message : String(chunkError)}`);
            }

            // Exponential backoff: wait 1s, 2s, 4s between retries
            const delay = 1000 * (4 - retries);
            setCurrentStatus(`Retrying chunk ${chunkIndex + 1} in ${delay/1000}s... (${3 - retries}/3)`);
            onStatusUpdate?.(`Retrying chunk ${chunkIndex + 1} in ${delay/1000}s... (${3 - retries}/3)`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Step 4: Finalize asset creation in Brandfolder
      setCurrentStatus("Creating asset in Brandfolder...");
      onStatusUpdate?.("Creating asset in Brandfolder...");

      const finalizeRes = await fetch("/api/brandfolder/upload?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          userName: userName,
          description: description || "",
          objectUrl: objectUrl
        })
      });

      if (!finalizeRes.ok) {
        const errorData = await finalizeRes.json();
        throw new Error(errorData.error || "Failed to create asset in Brandfolder");
      }

      const result = await finalizeRes.json();

      setCurrentStatus("Upload complete!");
      onStatusUpdate?.("Upload complete!");
      setUploadProgress(100);
      onProgress?.(100);

      console.log("🎉 Chunked upload completed successfully:", result);

      return {
        success: true,
        assetId: result.assetId,
        assetUrl: result.assetUrl
      };

    } catch (error) {
      console.error("💥 Chunked upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setCurrentStatus(`Error: ${errorMessage}`);
      onStatusUpdate?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFileChunked,
    isUploading,
    uploadProgress,
    currentStatus
  };
};

// Simple wrapper function for direct use
export const handleChunkedUpload = async (
  file: File,
  userName: string,
  description?: string,
  onProgress?: (progress: number) => void
): Promise<ChunkedUploadResult> => {
  const uploader = { uploadFileChunked: null } as any;
  const { uploadFileChunked } = useChunkedUpload();
  uploader.uploadFileChunked = uploadFileChunked;
  
  return uploader.uploadFileChunked({
    file,
    userName,
    description,
    onProgress
  });
};
