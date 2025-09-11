
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
      <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-pulse text-neutral-400">Loading survey...</div>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="bg-gradient-to-br from-emerald-900/60 to-green-900/60 border border-emerald-700/60 shadow-lg shadow-black/20 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/20">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-emerald-200">
            Survey Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-emerald-300">
            Thank you for sharing your valuable feedback with us.
          </p>
          <div className="flex justify-center">
            <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 shadow-lg">
              +25 Points Earned
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-500 hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-white">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md shadow-blue-500/20">
            <Star className="h-5 w-5 text-white" />
          </div>
          MVP Feedback Survey
          <Badge variant="secondary" className="bg-gradient-to-r from-amber-800/60 to-yellow-800/60 text-amber-200 border-amber-700/50 shadow-sm">
            25 Points
          </Badge>
        </CardTitle>
        <p className="text-neutral-300 text-sm">
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
                <Label className="flex items-center gap-2 text-sm font-medium text-neutral-200">
                  <div className="p-1 bg-neutral-700/60 rounded-md">
                    <Icon className="h-4 w-4 text-neutral-300" />
                  </div>
                  {question.question}
                </Label>
                <Textarea
                  value={responses[question.id] || ""}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  className="min-h-[100px] bg-neutral-800/60 border-neutral-700/60 text-white placeholder:text-neutral-500 focus:border-blue-500/60 focus:ring-blue-500/20 resize-none hover:bg-neutral-800/80 transition-colors duration-300"
                  required
                />
              </div>
            );
          })}

          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5"
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
