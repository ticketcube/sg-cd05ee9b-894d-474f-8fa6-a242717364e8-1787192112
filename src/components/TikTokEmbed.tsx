import { useEffect } from "react";

export function TikTokEmbed({
  username,
  videoId,
}: {
  username: string;
  videoId: string;
}) {
  const tiktokUrl = `https://www.tiktok.com/@${username}/video/${videoId}`;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [tiktokUrl]);

  return (
    <div 
      className="overflow-hidden rounded-lg"
      style={{ 
        maxWidth: "400px", 
        minWidth: "300px",
        height: "500px"
      }}
    >
      <blockquote
        className="tiktok-embed"
        cite={tiktokUrl}
        data-video-id={videoId}
        data-embed-type="video"
        data-autoplay="true"
        data-controls="0"
        data-branding="0"
        style={{ maxWidth: "400px", minWidth: "300px" }}
      >
        <section>Loading...</section>
      </blockquote>
    </div>
  );
}
