const handleUpload = async () => {
  if (!selectedFile || !user) return;

  setUploadStatus("uploading");
  setIsLoading(true);

  try {
    // Step 1: Start resumable upload
    const startRes = await fetch("/api/brandfolder/upload?action=start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: selectedFile.file.name,
        fileType: selectedFile.file.type,
        userName: user.username,
        description
      })
    });

    if (!startRes.ok) throw new Error("Failed to start upload session");
    const { resumableUploadUrl, objectUrl } = await startRes.json();

    // Step 2: Upload file directly to resumable URL
    const uploadRes = await fetch(resumableUploadUrl, {
      method: "PUT",
      headers: { "Content-Type": selectedFile.file.type },
      body: selectedFile.file
    });

    if (!uploadRes.ok) throw new Error("Failed to upload file to storage");

    // Step 3: Finalize asset in Brandfolder
    const finalizeRes = await fetch("/api/brandfolder/upload?action=create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: selectedFile.file.name,
        userName: user.username,
        description,
        objectUrl
      })
    });

    if (!finalizeRes.ok) throw new Error("Failed to create asset in Brandfolder");
    const result = await finalizeRes.json();

    setUploadStatus("success");
    console.log("✅ Upload complete:", result);
  } catch (error) {
    console.error("Upload error:", error);
    setUploadStatus("error");
    setErrorMessage(error instanceof Error ? error.message : "Upload failed");
  } finally {
    setIsLoading(false);
  }
};
