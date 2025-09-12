import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Star, MessageSquare } from "lucide-react";
import { mvpSurveyService, SurveyResponse } from "@/services/mvpSurveyService";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/contexts/UserProfileContext";

const SURVEY_QUESTION = {
  id: "overall_feedback",
  question: "How would you rate your overall experience with OTW Chart and what improvements would you suggest?",
  placeholder: "Share your thoughts on the platform's usability, features, value, and any suggestions for improvement..."
};

export function MvpSurvey() {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const { toast } = useToast();
  const { refreshProfile } = useUserProfile();

  useEffect(() => {
    checkSurveyStatus();
  }, []);

  const checkSurveyStatus = async () => {
    try {
      const completed = await mvpSurveyService.checkSurveyCompletion();
      setIsCompleted(completed);
    } catch (error) {
      console.error('Error checking survey status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      toast({
        variant: "destructive",
        title: "Incomplete Survey",
        description: "Please provide your feedback before submitting."
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const surveyResponse: SurveyResponse = {
        question: SURVEY_QUESTION.question,
        answer: response.trim()
      };

      const result = await mvpSurveyService.submitSurvey([surveyResponse]);
      
      if (result.success) {
        setIsCompleted(true);
        // Refresh profile to update points display
        await refreshProfile();
        toast({
          title: "Survey Submitted!",
          description: `Thank you for your feedback! You earned ${result.pointsEarned} points.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: result.message || "Please try again later."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit survey. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-pulse text-gray-400">Loading survey...</div>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="bg-green-50 border border-green-200 shadow-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-500 rounded-full">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-medium text-green-800">
            Survey Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-green-700">
            Thank you for sharing your valuable feedback with us.
          </p>
          <div className="flex justify-center">
            <Badge className="bg-green-600 text-white border-0 px-4 py-2">
              +25 Points Earned
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg font-medium text-black">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Star className="h-5 w-5 text-gray-600" />
          </div>
          MVP Feedback Survey
          <Badge className="bg-black text-white border-0 px-3 py-1">
            25 Points
          </Badge>
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Help us improve OTW Chart by sharing your experience and suggestions.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium text-black">
              <div className="p-1 bg-gray-100 rounded-md">
                <MessageSquare className="h-4 w-4 text-gray-600" />
              </div>
              {SURVEY_QUESTION.question}
            </Label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={SURVEY_QUESTION.placeholder}
              className="min-h-[120px] bg-white border-gray-200 text-black placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 resize-none"
              required
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-black hover:bg-gray-800 text-white border-0"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Submit Survey & Earn 25 Points
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}