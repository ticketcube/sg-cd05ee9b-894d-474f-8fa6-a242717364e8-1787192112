import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trophy, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { submitAllLocalVotes, clearLocalVotes } from '@/services/embedVotingService';

interface EmbedVotingCompleteAuthProps {
    artistCount: number;
    pointsToEarn: number;
}

export function EmbedVotingCompleteAuth({ artistCount, pointsToEarn }: EmbedVotingCompleteAuthProps) {
    const [mode, setMode] = useState<'choice'|'signup'|'login'> ('choice');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/embed/weekly`,
                },
            });

            if (error) throw error;

            if (data.user) {
                // Submit all local votes
                const result = await submitAllLocalVotes(data.user.id);

                if (result.success) {
                    toast.success(`Account created! ${result.submittedCount} ratings saved. Check your email to verify.`);
                } else {
                    toast.warning('Account created, but some ratings failed to save.');
                }
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            toast.error(error.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Submit all local votes
                const result = await submitAllLocalVotes(data.user.id);

                if (result.success) {
                    toast.success(`Welcome back! ${result.submittedCount} ratings saved and ${pointsToEarn} points earned!`);
                    clearLocalVotes();
                    window.location.reload();
                } else {
                    toast.warning('Logged in, but some ratings failed to save.');
                }
            }
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'choice') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-2xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto">
                            <Trophy className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold">
                            Amazing! All {artistCount} Artists Rated! 🎉
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Your ratings are saved locally. Sign in to save them permanently and earn rewards!
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-600" />
                                <span className="font-semibold text-gray-900">Earn {pointsToEarn} Points</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-gray-900">Track Your Influence</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-purple-600" />
                                <span className="font-semibold text-gray-900">Unlock Exclusive Rewards</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={() => setMode('signup')}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg font-bold"
                            >
                                Create Account
                            </Button>
                            <Button
                                onClick={() => setMode('login')}
                                variant="outline"
                                className="w-full py-6 text-lg font-bold"
                            >
                                I Have an Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (mode === 'signup') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
                        <CardDescription>Sign up to save your ratings and earn {pointsToEarn} points!</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account & Save Ratings'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setMode('choice')}
                                className="w-full"
                            >
                                Back
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (mode === 'login') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
                        <CardDescription>Sign in to save your ratings and earn {pointsToEarn} points!</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    'Sign In & Save Ratings'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setMode('choice')}
                                className="w-full"
                            >
                                Back
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}