import { Buffer } from "buffer"; // optional in Node, safe to include

export interface UploadOptions {
    file: File | Blob;
    fileName: string;
    fileType: string;
    description?: string;
    onProgress?: (percent: number) => void;
    apiKey?: string; // Optional if used server-side
}

export default class BrandfolderUpload {
    file: File | Blob;
    fileName: string;
    fileType: string;
    description?: string;
    onProgress?: (percent: number) => void;
    chunkSize = 5 * 1024 * 1024; // 5MB default
    apiKey?: string;

    constructor(options: UploadOptions) {
        this.file = options.file;
        this.fileName = options.fileName;
        this.fileType = options.fileType;
        this.description = options.description;
        this.onProgress = options.onProgress;
        this.apiKey = options.apiKey;
    }

    async startResumableUpload(): Promise<string> {
        const res = await fetch("https://api.brandfolder.com/v2/resumable_uploads", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey || process.env.BF_API_KEY}`,
            },
            body: JSON.stringify({
                fileName: this.fileName,
                fileType: this.fileType,
                description: this.description || "",
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Failed to start upload: ${errText}`);
        }

        const data = await res.json();
        return data.upload_url;
    }

    async uploadChunks(resumableUploadUrl: string) {
        const totalChunks = Math.ceil(this.file.size / this.chunkSize);
        let uploadedBytes = 0;

        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.chunkSize;
            const end = i === totalChunks - 1 ? this.file.size : start + this.chunkSize;
            const chunk = this.file.slice(start, end);

            let retries = 3;
            while (retries > 0) {
                try {
                    const res = await fetch(resumableUploadUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Range": `bytes ${start}-${end - 1}/${this.file.size}`,
                            "Content-Type": this.fileType,
                        },
                        body: chunk,
                    });

                    if (res.ok || res.status === 308) {
                        uploadedBytes = end;
                        this.onProgress?.((uploadedBytes / this.file.size) * 100);
                        break;
                    } else {
                        throw new Error(`Chunk upload failed with status ${res.status}`);
                    }
                } catch (err) {
                    retries--;
                    if (retries === 0) throw err;
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, 3 - retries))); // exponential backoff
                }
            }
        }

        return true;
    }
}
