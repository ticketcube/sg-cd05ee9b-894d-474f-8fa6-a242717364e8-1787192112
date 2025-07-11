import { useEffect } from "react";

export function TikTokEmbed({
  username,
  videoId,
}: {
  username: string;
  videoId: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg">
      <iframe
        src={`https://www.tiktok.com/embed/v2/${videoId}`}
        width="250"
        height="440"
        allowFullScreen
        frameBorder="0"
        style={{ border: "none" }}
      />
    </div>
  );
}
