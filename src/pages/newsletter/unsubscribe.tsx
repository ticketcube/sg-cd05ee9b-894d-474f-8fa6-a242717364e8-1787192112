import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { newsletterService } from "@/services/newsletterService";

export default function UnsubscribePage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token && typeof token === "string") {
      handleUnsubscribe(token);
    }
  }, [token]);

  const handleUnsubscribe = async (unsubToken: string) => {
    try {
      const result = await newsletterService.unsubscribe(unsubToken);
      
      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        localStorage.removeItem("newsletter_email");
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Newsletter Unsubscribe</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your request...</p>
            </div>
          )}

          {status === "success" && (
            <div>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium mb-2">{message}</p>
              <p className="text-sm text-gray-600 mb-4">
                You won't receive any more emails from us.
              </p>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
              >
                Return to Home
              </Button>
            </div>
          )}

          {status === "error" && (
            <div>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium mb-2">{message}</p>
              <p className="text-sm text-gray-600 mb-4">
                If you continue to have issues, please contact us.
              </p>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
              >
                Return to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
