import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, TestTube, Clock, Users, Mail, AlertCircle, CheckCircle, Lock } from "lucide-react";
import { newsletterService } from "@/services/newsletterService";

export default function NewsletterSendPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminSecret, setAdminSecret] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // Check authentication and role on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push("/");
        return;
      }

      // Check user's role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile || profile.role !== "otwstaff") {
        // Unauthorized - redirect to home
        router.push("/");
        return;
      }

      // User is authenticated and has otwstaff role
      setIsAuthorized(true);
      loadStats();
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Verifying access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unauthorized state (should not be visible due to redirect, but just in case)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Lock className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-bold">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to access this page.</p>
              <Button onClick={() => router.push("/")} className="mt-4">
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authorized - show the newsletter admin interface
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📧 Newsletter Admin</h1>
          <p className="text-gray-600">Send weekly newsletters to subscribers</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            OTW Staff Access
          </div>
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
