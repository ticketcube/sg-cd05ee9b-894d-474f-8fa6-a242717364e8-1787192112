
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, TestTube, Clock, Users, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { newsletterService } from "@/services/newsletterService";

export default function NewsletterSendPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // Load stats on mount
  useState(() => {
    loadStats();
  });

  const loadStats = async () => {
    const data = await newsletterService.getStats();
    setStats(data);
  };

  const handleSendTest = async () => {
    if (!adminSecret || !testEmail) {
      alert("Please enter admin secret and test email");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/newsletter/send-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: adminSecret,
          testMode: true,
          testEmail
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendWeekly = async () => {
    if (!adminSecret) {
      alert("Please enter admin secret");
      return;
    }

    if (!confirm("Are you sure you want to send the weekly newsletter to ALL active subscribers? This cannot be undone.")) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/newsletter/send-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: adminSecret,
          testMode: false
        })
      });

      const data = await response.json();
      setResult(data);
      await loadStats();
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📧 Newsletter Admin</h1>
          <p className="text-gray-600">Send weekly newsletters to subscribers</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Subscribers</p>
                    <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Subscribers</p>
                    <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
                  </div>
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Last Email Sent</p>
                    <p className="text-sm font-bold">
                      {stats.lastEmailSent 
                        ? new Date(stats.lastEmailSent).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Authentication</CardTitle>
            <CardDescription>Enter your admin secret to access newsletter controls</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              placeholder="Admin Secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="mb-4"
            />
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Send Test Email
            </CardTitle>
            <CardDescription>
              Send a test newsletter to a specific email address to preview the content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button
              onClick={handleSendTest}
              disabled={sending || !adminSecret || !testEmail}
              className="w-full"
              variant="outline"
            >
              {sending ? "Sending..." : "Send Test Email"}
            </Button>
          </CardContent>
        </Card>

        {/* Send Weekly Newsletter */}
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Weekly Newsletter
            </CardTitle>
            <CardDescription>
              Send the weekly newsletter to all active subscribers (typically sent every Thursday)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                This will send emails to <strong>{stats?.activeSubscribers || 0} active subscribers</strong>. 
                Make sure you've tested the email first!
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleSendWeekly}
              disabled={sending || !adminSecret}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {sending ? "Sending to All Subscribers..." : "🚀 Send Weekly Newsletter"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className={result.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Success
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Error
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{result.message}</p>
              {result.stats && (
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <p><strong>Sent:</strong> {result.stats.sent}</p>
                  <p><strong>Failed:</strong> {result.stats.failed}</p>
                  <p><strong>Total Subscribers:</strong> {result.stats.totalSubscribers}</p>
                  <p><strong>Weekend Events:</strong> {result.stats.weekendEvents}</p>
                  <p><strong>Next Week Events:</strong> {result.stats.nextWeekEvents}</p>
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-red-600 mb-2">Errors:</p>
                  <div className="bg-red-50 p-4 rounded max-h-40 overflow-y-auto">
                    {result.errors.map((error: string, idx: number) => (
                      <p key={idx} className="text-sm text-red-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Weekly Newsletter Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>1. Test First:</strong> Always send a test email to yourself before sending to all subscribers</p>
            <p><strong>2. Review Content:</strong> Check that events are loading correctly and emails look good</p>
            <p><strong>3. Schedule:</strong> Typically send every Thursday morning</p>
            <p><strong>4. Monitor:</strong> Check the results after sending to ensure all emails were delivered</p>
            <hr className="my-4" />
            <p className="text-gray-600">
              <strong>What Gets Sent:</strong> Each subscriber receives events filtered by their home city (if set), 
              including this weekend (Thu-Sun) and next week (Mon-Sun) events.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
