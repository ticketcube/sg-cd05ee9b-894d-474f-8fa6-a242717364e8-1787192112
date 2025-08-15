import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import pointsTestService from '@/services/pointsTestService';
import { pointsConfigService } from '@/services/pointsConfigService';
import { weeklyVotingService } from '@/services/weeklyVotingService';
import { useAuth } from '@/contexts/AuthContext';

export default function TestPointsPage() {
  const { user, profile } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBasicTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 Running basic points system test...');
      
      // Test 1: Points configuration loading
      const config = await pointsConfigService.getAllConfigs();
      console.log('✅ Points config loaded:', config);
      
      // Test 2: Get specific values
      const videoViewPoints = await pointsConfigService.getPoints('video_view');
      const minWatchTime = await pointsConfigService.getMinValue('video_view');
      const frequency = await pointsConfigService.getFrequency('video_view');
      
      console.log('📊 Video view points:', videoViewPoints);
      console.log('📊 Min watch time:', minWatchTime);
      console.log('📊 Frequency:', frequency);
      
      setTestResults({
        success: true,
        config,
        videoViewPoints,
        minWatchTime,
        frequency
      });
      
    } catch (err) {
      console.error('❌ Basic test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const runVideoViewTest = async () => {
    if (!user || !profile) {
      setError('Please log in to run this test');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 Running video view test...');
      
      // Test recording a video view
      const testArtistUuid = "5eae69ed-f8a0-4a25-93b5-fe8a1c7b062c"; // Laufey
      const testWeekIdentifier = "2025-W33"; // Current week
      
      const result = await weeklyVotingService.recordVideoView({
        userId: profile.id,
        artistUuid: testArtistUuid,
        weekIdentifier: testWeekIdentifier,
        watchTimeSeconds: 20 // Above 15 second minimum
      });
      
      console.log('📊 Video view result:', result);
      
      setTestResults({
        success: true,
        videoViewResult: result,
        userId: profile.id,
        artistUuid: testArtistUuid,
        weekIdentifier: testWeekIdentifier
      });
      
    } catch (err) {
      console.error('❌ Video view test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTestSuite = async () => {
    if (!user || !profile) {
      setError('Please log in to run the full test suite');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('🚀 Running comprehensive test suite...');
      
      const result = await pointsTestService.runComprehensiveTestSuite(profile.id);
      console.log('🎉 Test suite completed:', result);
      
      setTestResults(result);
      
    } catch (err) {
      console.error('❌ Full test suite failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black/50 border-purple-500/20 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Points System Diagnostic Tool</CardTitle>
            {user && profile && (
              <p className="text-center text-purple-200">Logged in as: {profile.username} ({user.email})</p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={runBasicTest} 
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Testing...' : 'Basic Config Test'}
              </Button>
              
              <Button 
                onClick={runVideoViewTest} 
                disabled={isLoading || !user || !profile}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Testing...' : 'Video View Test'}
              </Button>
              
              <Button 
                onClick={runFullTestSuite} 
                disabled={isLoading || !user || !profile}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? 'Testing...' : 'Full Test Suite'}
              </Button>
            </div>

            {!user && (
              <div className="text-center p-4 bg-yellow-900/30 rounded border border-yellow-500/50">
                <p className="text-yellow-200">Please log in to run user-specific tests</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-900/30 rounded border border-red-500/50">
                <h3 className="font-semibold text-red-200">Error:</h3>
                <pre className="text-red-300 whitespace-pre-wrap text-sm mt-2">{error}</pre>
              </div>
            )}

            {testResults && (
              <div className="p-4 bg-green-900/30 rounded border border-green-500/50">
                <h3 className="font-semibold text-green-200 mb-3">Test Results:</h3>
                <div className="space-y-2">
                  <Badge className="bg-green-600">
                    Status: {testResults.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  
                  {testResults.videoViewPoints && (
                    <p className="text-green-300">Video View Points: {testResults.videoViewPoints}</p>
                  )}
                  
                  {testResults.minWatchTime && (
                    <p className="text-green-300">Min Watch Time: {testResults.minWatchTime}s</p>
                  )}
                  
                  {testResults.frequency && (
                    <p className="text-green-300">Frequency: {testResults.frequency}</p>
                  )}
                  
                  {testResults.videoViewResult && (
                    <div className="mt-4">
                      <p className="text-green-300">Video View Test Result:</p>
                      <pre className="text-green-200 text-sm mt-1 bg-black/30 p-2 rounded">
                        {JSON.stringify(testResults.videoViewResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                
                <details className="mt-4">
                  <summary className="text-green-200 cursor-pointer">Full Results (Click to expand)</summary>
                  <pre className="text-green-100 text-xs mt-2 bg-black/30 p-2 rounded overflow-auto max-h-64">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            <div className="p-4 bg-blue-900/30 rounded border border-blue-500/50">
              <h3 className="font-semibold text-blue-200">Instructions:</h3>
              <ul className="text-blue-300 text-sm mt-2 space-y-1">
                <li>1. <strong>Basic Config Test</strong>: Tests if points configuration loads correctly</li>
                <li>2. <strong>Video View Test</strong>: Tests recording a video view and earning points (requires login)</li>
                <li>3. <strong>Full Test Suite</strong>: Comprehensive test of all systems (requires login)</li>
                <li>4. Check browser console for detailed logs</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}