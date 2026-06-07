import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Fallback client-side redirect (next.config.mjs handles server-side)
    router.replace("https://ticketcube.org/otw");
  }, [router]);

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1>Redirecting...</h1>
        <p>You will be redirected to ticketcube.org/otw</p>
        <p style={{ marginTop: "20px" }}>
          <a href="https://ticketcube.org/otw" style={{ color: "#0070f3" }}>
            Click here if you are not redirected automatically
          </a>
        </p>
      </div>
    </div>
  );
}