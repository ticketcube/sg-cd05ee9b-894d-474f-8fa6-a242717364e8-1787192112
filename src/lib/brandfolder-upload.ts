export interface UploadOptions {
    file: File;
    onProgress?: (percent: number, chunkIndex?: number, totalChunks?: number) => void;
}

export default class BrandfolderUpload {
    file: File;
    onProgress?: UploadOptions["onProgress"];
    chunkSize = 1 * 1024 * 1024; // 5MB default

    constructor(options: UploadOptions) {
        this.file = options.file;
        this.onProgress = options.onProgress;
    }

    async upload() {
        // Step 1: Initialize upload via API route
        const initRes = await fetch("/api/brandfolder/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: this.file.name,
                file_size: this.file.size,
                mimetype: this.file.type,
            }),
        });

        const { resumableUploadUrl } = await initRes.json();

        // Step 2: Upload chunks
        const totalChunks = Math.ceil(this.file.size / this.chunkSize);

        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.chunkSize;
            const end = Math.min(start + this.chunkSize, this.file.size);
            const chunk = this.file.slice(start, end);

            let retries = 3;
            while (retries > 0) {
                try {
                    const res = await fetch(`/api/brandfolder/upload?uploadUrl=${encodeURIComponent(resumableUploadUrl)}`, {
                        method: "PUT",
                        headers: { "Content-Range": `bytes ${start}-${end - 1}/${this.file.size}` },
                        body: chunk,
                    });

                    if (res.ok || res.status === 308) {
                        this.onProgress?.(((i + 1) / totalChunks) * 100, i, totalChunks);
                        break;
                    } else {
                        throw new Error(`Chunk failed with status ${res.status}`);
                    }
                } catch (err) {
                    retries--;
                    if (retries === 0) throw err;
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, 3 - retries)));
                }
            }
        }

        return true;
    }
}
