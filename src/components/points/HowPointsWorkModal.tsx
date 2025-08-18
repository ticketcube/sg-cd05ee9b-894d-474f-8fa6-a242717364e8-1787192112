
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, Play, Vote, Trophy, Zap, Users, Star, Award } from "lucide-react";

interface HowPointsWorkModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function HowPointsWorkModal({ 
  isOpen, 
  onOpenChange, 
  trigger 
}: HowPointsWorkModalProps) {
  const [open, setOpen] = useState(isOpen || false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            How Points Work
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            How to Earn Points
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tips">Pro Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {/* Video Points */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Play className="w-5 h-5 text-blue-500" />
                    Video Watching
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      5 points
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Watch artist videos to earn points - available anytime!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Watch any artist video for <strong>15+ seconds</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Earn <strong>5 points per artist per week</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <strong>Always available</strong> - no time restrictions!
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Voting Points */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Vote className="w-5 h-5 text-green-500" />
                    Weekly Voting
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      10 points
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Submit your weekly rankings during voting periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      Submit any weekly vote (ranking or quadrant)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <strong>10 points once per week</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      Only available during voting windows
                    </li>
                  </ul>
                </CardContent>
              </Card>

             
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Frequency Rules</CardTitle>
                  <CardDescription>
                    Understanding when you can earn points
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">Video Points</p>
                      <p className="text-sm text-blue-700">Once per artist per week</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">5pts</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">Voting Points</p>
                      <p className="text-sm text-green-700">Once per week</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">10pts</Badge>
                  </div>

                 
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Example Week</CardTitle>
                  <CardDescription>
                    How you could earn points in Week 30
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Watch Laufey video (20 seconds)</span>
                      <Badge variant="outline" className="text-blue-600">+5 pts</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Watch Billie Eilish video (25 seconds)</span>
                      <Badge variant="outline" className="text-blue-600">+5 pts</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Watch remaining 3 videos (15+ seconds)</span>
                      <Badge variant="outline" className="text-blue-600">+15 pts</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Complete all videos bonus</span>
                      <Badge variant="outline" className="text-yellow-600">+15 pts</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Submit weekly votes</span>
                      <Badge variant="outline" className="text-green-600">+10 pts</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded font-medium">
                      <span>Total possible points this week</span>
                      <Badge className="bg-purple-100 text-purple-800">+50 pts</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-purple-500" />
                    Pro Tips
                  </CardTitle>
                  <CardDescription>
                    Maximize your points with these strategies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Watch videos anytime</p>
                        <p className="text-sm text-gray-600">Video points are always available, even after voting closes. Catch up on any week!</p>
                      </div>
                    </div>

                   

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-yellow-600">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Vote during the window</p>
                        <p className="text-sm text-gray-600">Voting points are only available during the weekly voting period. Don't miss out!</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-600">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Repeat artists = new opportunities</p>
                        <p className="text-sm text-gray-600">If Laufey appears in Week 35, you can earn points for her again!</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-500" />
                    Coming Soon
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Weekly streak bonuses for consecutive voting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-pink-500" />
                      <span className="text-sm">Referral bonuses for bringing friends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Leaderboards and achievements</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => handleOpenChange(false)}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
