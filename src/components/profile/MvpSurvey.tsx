import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Star, MessageSquare, Gift, Sparkles } from "lucide-react";
import { mvpSurveyService, SurveyResponse } from "@/services/mvpSurveyService";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/contexts/UserProfileContext";

const SURVEY_QUESTION = {
    id: "overall_feedback",
    question: "On a scale of 1-10, how likely would you be to share this app with your friends?",
    placeholder: "Enter a number between 1-10 and please share any thoughts on the platform's usability, features, value, and any suggestions for improvement..."
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                        <div className="h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                <div className="p-6">
                    <div className="text-center space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                <Sparkles className="h-3 w-3 text-white" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Survey Completed!
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Thank you for sharing your valuable feedback with us.
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 px-4 py-2 text-sm font-medium">
                                <Gift className="w-4 h-4 mr-2" />
                                +25 Points Earned
                            </Badge>
                        </div>

                        <div className="text-xs text-gray-500 bg-white/60 rounded-lg p-3 border border-green-100">
                            New surveys are released monthly - check back for more rewards!
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Star className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-xs font-bold text-white">!</span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Monthly Survey
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-medium">
                            25 Points
                        </Badge>
                    </h3>
                    <p className="text-sm text-gray-600">
                        New rewards every month!
                    </p>
                </div>
            </div>

            {/* Survey Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-purple-500 flex-shrink-0" />
                        <span>{SURVEY_QUESTION.question}</span>
                    </Label>
                    <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder={SURVEY_QUESTION.placeholder}
                        className="min-h-[120px] bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500 resize-none rounded-lg"
                        required
                    />
                </div>

                <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 h-11 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    {submitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Submitting...</span>
                        </div>
                    ) : (
                        <>
                            <Gift className="h-4 w-4" />
                            <span>Submit & Earn 25 Points</span>
                        </>
                    )}
                </Button>
            </form>

            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-purple-700">
                        <p className="font-medium mb-1">Why we ask:</p>
                        <p>Your feedback helps us improve the platform and create better experiences for music lovers like you!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
