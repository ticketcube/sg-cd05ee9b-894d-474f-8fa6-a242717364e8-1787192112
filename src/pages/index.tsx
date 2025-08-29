export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);

    const handleNavigation = async (path: string) => {
        if (!user) {
            setAuthDialogOpen(true);
            return;
        }
        try {
            await router.push(path);
        } catch (error) {
            console.error("Navigation error:", error);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-black via-indigo-950 to-black text-white overflow-hidden">
            {/* Animated stars / gradient blobs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-[700px] h-[700px] bg-purple-700/30 rounded-full blur-3xl top-[-200px] left-[-200px] animate-pulse" />
                <div className="absolute w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-3xl bottom-[-200px] right-[-100px] animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 py-16 relative z-10">
                {/* Welcome message */}
                {user && (
                    <div className="text-center mb-12">
                        <p className="text-purple-200 text-lg animate-fade-in">
                            Welcome back, <span className="font-bold">{user.username || "Explorer"}</span> ✨
                        </p>
                    </div>
                )}

                {/* Main Navigation Cards */}
                <div className="max-w-4xl mx-auto grid gap-8">
                    <Card
                        className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 border-0 rounded-3xl shadow-2xl transform hover:scale-[1.04] hover:rotate-1 transition-all duration-500 cursor-pointer group"
                        onClick={() => handleNavigation("/discovery-dashboard")}
                    >
                        {/* Glow overlays */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15),transparent),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.1),transparent)] animate-pulse" />

                        <CardContent className="relative p-10 h-full flex flex-col justify-between z-10">
                            <div>
                                <div className="flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-8 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-lg">
                                    <Trophy className="w-10 h-10 text-yellow-300 drop-shadow-md animate-bounce" />
                                </div>
                                <h2 className="text-4xl font-extrabold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-300 animate-gradient-x">
                                    Discover. Vote. Shine.
                                </h2>
                                <p className="text-center text-white/80 mb-8 text-lg leading-relaxed">
                                    Join a cosmic journey of discovery. Vote weekly and unlock rewards across the galaxy.
                                </p>
                            </div>
                            <Button className="w-full py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-yellow-300 to-pink-300 text-indigo-900 shadow-lg hover:shadow-yellow-400/50 hover:scale-105 transition">
                                {user ? "Keep Exploring ✨" : "Begin Your Journey 🚀"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="text-center mt-20 relative">
                    <div className="h-px w-1/2 mx-auto bg-gradient-to-r from-transparent via-purple-400/50 to-transparent mb-6" />
                    <div className="flex items-center justify-center space-x-2 text-gray-400">
                        <Music className="w-6 h-6 text-blue-400 animate-pulse" />
                        <span className="text-base md:text-lg">Powered by community votes and engagement</span>
                    </div>
                </div>
            </div>

            {/* Auth Dialog */}
            <AuthDialog
                isOpen={isAuthDialogOpen}
                onClose={() => setAuthDialogOpen(false)}
                title="Join OnesToWatch"
            />
        </div>
    );
}
