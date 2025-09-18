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
    question: "On a scale of 1-10, how likely would you be to share this app with your friends?",
    placeholder: "Enter a number between 1-10 and please share any thoughts on the platform's usability, features, value, and any suggestions for improvement..."
};

export function MvpSurvey() {
    const [isCompleted, setIsCompleted] = useState < boolean > (false);
    const [loading, setLoading] = useState < boolean > (true);
    const [submitting, setSubmitting] = useState < boolean > (false);
    const [response, setResponse] = useState < string > ("");
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
            console.error("Error checking survey status:", error);
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
                <CardContent className="flex items-center justify-center p-6">
                    <div className="animate-pulse text-gray-400">Loading survey...</div>
                </CardContent>
            </Card>
        );
    }

    if (isCompleted) {
        return (
            <Card className="bg-purple-deep/10 border border-purple-deep shadow-sm">
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-purple-deep rounded-full">
                            <CheckCircle className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-xl font-medium text-purple-deep">
                        Survey Completed!
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                    <p className="text-purple-deep">
                        Thank you for sharing your valuable feedback with us.
                    </p>
                    <div className="flex justify-center">
                        <Badge className="bg-purple-deep text-white border-0 px-3 py-1">
                            +25 Points Earned
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-medium text-black">
                    <div className="p-2 bg-purple-deep/20 rounded-lg">
                        <Star className="h-5 w-5 text-purple-deep" />
                    </div>
                    MVP Feedback Survey
                    <Badge className="bg-purple-deep text-white border-0 px-2 py-0.5 text-xs sm:text-sm">
                        25 Points
                    </Badge>
                </CardTitle>
                <p className="text-gray-600 text-sm mt-1">
                    Help us improve OTW Chart by sharing your experience and suggestions.
                </p>
            </CardHeader>
            <CardContent className="pt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-black">
                            <div className="p-1 bg-purple-deep/10 rounded-md">
                                <MessageSquare className="h-4 w-4 text-purple-deep" />
                            </div>
                            {SURVEY_QUESTION.question}
                        </Label>
                        <Textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder={SURVEY_QUESTION.placeholder}
                            className="min-h-[100px] bg-white border-gray-200 text-black placeholder:text-gray-400 focus:border-purple-deep focus:ring-0 resize-none"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-purple-deep hover:bg-purple-deep/90 text-white border-0 h-10 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </div>
                        ) : (
                            <>
                                <Star className="h-4 w-4" />
                                Submit Survey & Earn 25 Points
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
