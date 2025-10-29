
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { BrandfolderUploadPage } from "@/components/brandfolderUploadPage";
import { useRouter } from "next/router";
import { 
  User, 
  Mail, 
  Shield, 
  Database, 
  Music2, 
  MapPin, 
  Video,
  ArrowRight,
  Upload
} from "lucide-react";

export function StaffDashboard() {
  const { profile, user } = useUserProfile();
  const router = useRouter();

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  const initials = profile.username 
    ? profile.username.charAt(0).toUpperCase() 
    : user.email?.charAt(0).toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Staff Dashboard</h1>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Admin Access
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Staff Profile Header - Enhanced */}
          <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-24"></div>
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 -mt-12">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                  <AvatarFallback className="text-blue-700 font-bold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left pt-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {profile.username || "Staff Member"}
                    </h2>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <span>Admin Role</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/profile")}
                    className="border-slate-300 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Artist Database Card */}
            <Card 
              className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
              onClick={() => router.push("/artist-lookup")}
            >
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  OTW Artist Database
                </h3>
                
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Lookup, Edit and Add OTW Artists to our 850+ Artist Database
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-blue-50 text-sm">
                    <Music2 className="w-4 h-4" />
                    <span>Artist Name & Genre</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-50 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Home Location</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-50 text-sm">
                    <Video className="w-4 h-4" />
                    <span>Video URL</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-white hover:bg-blue-50 text-blue-700 font-semibold shadow-lg group-hover:shadow-xl transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/artist-lookup");
                  }}
                >
                  Access Database
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* Media Upload Card */}
            <Card className="bg-white border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="border-b border-slate-100 bg-slate-50">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Upload className="w-5 h-5 text-slate-600" />
                  Brandfolder Media Upload
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-slate-600 mb-6">
                  Upload images, videos, and other media assets directly to the OTW Brandfolder for team use.
                </p>
                
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Upload className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Quick Upload</p>
                      <p className="text-xs text-slate-600">Files up to 15GB supported</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-xs text-slate-600 mb-4">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Automatic organization by uploader
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Optional descriptions supported
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Instant team access
                    </li>
                  </ul>

                  <Button 
                    variant="outline"
                    className="w-full border-blue-300 hover:bg-blue-50 text-blue-700"
                    onClick={() => {
                      const uploadSection = document.getElementById("upload-section");
                      uploadSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Go to Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Section */}
          <div id="upload-section">
            <BrandfolderUploadPage />
          </div>
        </div>
      </div>
    </div>
  );
}
