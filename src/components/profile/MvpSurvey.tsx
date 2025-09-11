import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Star, MessageSquare, Lightbulb } from "lucide-react";
import { mvpSurveyService, SurveyResponse } from "@/services/mvpSurveyService";
import { useToast } from "@/hooks/use-toast";

const SURVEY_QUESTIONS = [
  {
    id: "overall_experience",
    question: "How would you rate your overall experience with OTW Chart so far?",
    placeholder: "Share your thoughts on the platform's usability, features, and value..."
  },
  {
    id: "most_valuable_feature",
    question: "What feature or aspect of OTW Chart do you find most valuable?",
    placeholder: "Tell us about the features that have been most useful to you..."
  },
  {
    id: "improvement_suggestions",
    question: "What improvements or new features would you like to see in the future?",
    placeholder: "Share your ideas for making OTW Chart even better..."
  }
];

export function MvpSurvey() {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

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

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const surveyResponses: SurveyResponse[] = SURVEY_QUESTIONS.map(q => ({
      question: q.question,
      answer: responses[q.id] || ""
    }));

    // Validate all questions are answered
    if (surveyResponses.some(r => !r.answer.trim())) {
      toast({
        variant: "destructive",
        title: "Incomplete Survey",
        description: "Please answer all questions before submitting."
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const result = await mvpSurveyService.submitSurvey(surveyResponses);
      
      if (result.success) {
        setIsCompleted(true);
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
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 shadow-lg shadow-blue-900/5">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-pulse text-blue-600">Loading survey...</div>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/60 shadow-lg shadow-emerald-900/5">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-emerald-500 rounded-full shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-emerald-800">
            Survey Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-emerald-700">
            Thank you for sharing your valuable feedback with us.
          </p>
          <div className="flex justify-center">
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2">
              +25 Points Earned
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 shadow-lg shadow-blue-900/5 hover:shadow-xl hover:shadow-blue-900/10 transition-all duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-blue-800">
          <div className="p-2 bg-blue-500 rounded-lg shadow-md">
            <Star className="h-5 w-5 text-white" />
          </div>
          MVP Feedback Survey
          <Badge variant="secondary" className="bg-blue-200/60 text-blue-800 border-blue-300/60">
            25 Points
          </Badge>
        </CardTitle>
        <p className="text-blue-700 text-sm">
          Help us improve OTW Chart by sharing your experience and suggestions.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {SURVEY_QUESTIONS.map((question, index) => {
            const icons = [MessageSquare, Lightbulb, Star];
            const Icon = icons[index] || MessageSquare;
            
            return (
              <div key={question.id} className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <Icon className="h-4 w-4 text-blue-600" />
                  {question.question}
                </Label>
                <Textarea
                  value={responses[question.id] || ""}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  className="min-h-[100px] bg-white/60 border-blue-200/60 focus:border-blue-400 focus:ring-blue-400/20 resize-none"
                  required
                />
              </div>
            );
          })}

          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
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