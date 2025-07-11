
export function TikTokEmbed({
  videoId,
}: {
  videoId: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg">
      <iframe
        src={`https://www.tiktok.com/embed/v2/${videoId}`}
        width="350"
        height="350"
        allowFullScreen
        frameBorder="0"
        style={{ border: "none" }}
      />
    </div>
  );
}
