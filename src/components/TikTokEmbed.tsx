
import { useEffect, useRef } from "react";

export function TikTokEmbed({
  username,
  videoId,
}: {
  username: string;
  videoId: string;
}) {
  const tiktokUrl = `https://www.tiktok.com/@${username}/video/${videoId}`;
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    // Reset timer
    const timer = setTimeout(() => {
      if (embedRef.current) {
        // Remove and re-add the embed to reset it
        const parent = embedRef.current;
        const oldEmbed = parent.querySelector(".tiktok-embed");
        if (oldEmbed) {
          parent.removeChild(oldEmbed);
        }
        
        const newBlockquote = document.createElement("blockquote");
        newBlockquote.className = "tiktok-embed";
        newBlockquote.setAttribute("cite", tiktokUrl);
        newBlockquote.setAttribute("data-video-id", videoId);
        newBlockquote.setAttribute("data-embed-type", "video");
        newBlockquote.setAttribute("data-autoplay", "true");
        newBlockquote.setAttribute("data-controls", "0");
        newBlockquote.setAttribute("data-branding", "0");
        newBlockquote.style.maxWidth = "400px";
        newBlockquote.style.minWidth = "300px";
        
        const section = document.createElement("section");
        section.textContent = "Loading...";
        newBlockquote.appendChild(section);
        
        parent.appendChild(newBlockquote);
        
        // Reinitialize TikTok embed
        const newScript = document.createElement("script");
        newScript.src = "https://www.tiktok.com/embed.js";
        newScript.async = true;
        document.body.appendChild(newScript);
      }
    }, 10000); // 10 seconds

    return () => {
      document.body.removeChild(script);
      clearTimeout(timer);
    };
  }, [tiktokUrl, videoId]);

  return (
    <div 
      ref={embedRef}
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
