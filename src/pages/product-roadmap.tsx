import { useState, useEffect } from 'react';
import { useUser } from "@supabase/auth-helpers-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit, Trash2, Reply, Shield, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: number;
  auth_id: string;
  parent_comment_id: number | null;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    username: string;
    role: string;
  };
  replies?: Comment[];
}

export default function ProductRoadmap() {
  const user = useUser();
  const { profile, role, loading: profileLoading } = useUserProfile();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if user is staff
  const isStaff = role === 'otwstaff';

  useEffect(() => {
    if (profileLoading) return;
    
    if (user && profile && isStaff) {
      loadComments();
    } else if (!profileLoading && (!user || !profile || !isStaff)) {
      setLoading(false);
    }
  }, [user, profile, isStaff, profileLoading]);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const testConnection = async () => {
    console.log('🧪 [Frontend] Testing API connection...');
    try {
      // First test - simple fetch without auth
      const testResponse = await fetch('/api/product-roadmap/comments');
      console.log('🧪 [Frontend] No-auth test response status:', testResponse.status);
      
      if (testResponse.status === 401) {
        console.log('✅ [Frontend] API endpoint is reachable (got expected 401)');
      }
      
      // Second test - with auth
      const token = await getAuthToken();
      console.log('🧪 [Frontend] Auth token for test:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token) {
        const authResponse = await fetch('/api/product-roadmap/comments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('🧪 [Frontend] Auth test response status:', authResponse.status);
        console.log('🧪 [Frontend] Auth test response ok:', authResponse.ok);
        
        const responseText = await authResponse.text();
        console.log('🧪 [Frontend] Auth test response text:', responseText.substring(0, 200));
      }
      
    } catch (err) {
      console.error('🚨 [Frontend] Connection test failed:', err);
    }
  };

  // Add test button in the UI temporarily
  const debugMode = true; // Set to false to hide test button

  const loadComments = async () => {
    try {
      console.log('🔍 [Frontend] Starting loadComments...');
      setLoading(true);
      setError(null);
      
      console.log('🔍 [Frontend] Getting auth token...');
      const token = await getAuthToken();
      
      if (!token) {
        console.log('❌ [Frontend] No auth token available');
        setError("Authentication required");
        return;
      }
      
      console.log('✅ [Frontend] Auth token obtained, length:', token.length);
      console.log('🔍 [Frontend] Making fetch request to /api/product-roadmap/comments...');
      
      const response = await fetch('/api/product-roadmap/comments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ [Frontend] Fetch response received. Status:', response.status);
      console.log('🔍 [Frontend] Response ok:', response.ok);
      console.log('🔍 [Frontend] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Frontend] Response not ok. Status:', response.status, 'Error text:', errorText);
        
        // Try to parse as JSON for better error details
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ [Frontend] Parsed error details:', errorJson);
          setError(`Failed to load comments: ${errorJson.error || errorJson.message || 'Unknown error'} (Status: ${response.status})`);
        } catch (parseError) {
          console.error('❌ [Frontend] Could not parse error response as JSON');
          setError(`Failed to load comments (Status: ${response.status}): ${errorText}`);
        }
        return;
      }

      console.log('🔍 [Frontend] Parsing response as JSON...');
      const data = await response.json();
      console.log('✅ [Frontend] Response parsed successfully. Raw data:', data);
      console.log('✅ [Frontend] Comments array:', data.comments);
      console.log('✅ [Frontend] Comments count:', data.comments?.length || 0);
      
      // Add validation for the response structure
      if (!data || typeof data !== 'object') {
        console.error('❌ [Frontend] Invalid response structure:', data);
        setError('Server returned invalid data format');
        return;
      }
      
      if (!Array.isArray(data.comments)) {
        console.error('❌ [Frontend] Comments is not an array:', data.comments);
        setError('Server returned invalid comments format');
        return;
      }
      
      console.log('🔍 [Frontend] Setting comments state...');
      setComments(data.comments || []);
      setError(null);
      console.log('✅ [Frontend] Comments state updated successfully');
      
      // Verify state was actually set
      setTimeout(() => {
        console.log('🔍 [Frontend] State check - comments length:', comments.length);
      }, 100);
      
    } catch (err) {
      console.error('🚨 [Frontend] Unexpected error in loadComments:', err);
      console.error('🚨 [Frontend] Error name:', (err as Error)?.name);
      console.error('🚨 [Frontend] Error message:', (err as Error)?.message);
      console.error('🚨 [Frontend] Error stack:', (err as Error)?.stack);
      
      // Provide more detailed error information
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Could not connect to server. Check your internet connection.');
      } else if (err instanceof SyntaxError) {
        setError('Server response format error. The server returned invalid JSON.');
      } else if (err instanceof Error) {
        setError(`Failed to load comments: ${err.message}`);
      } else {
        setError('Failed to load comments: Unknown error occurred');
      }
    } finally {
      console.log('🔍 [Frontend] Setting loading to false...');
      setLoading(false);
      console.log('🏁 [Frontend] loadComments completed');
    }
  };

  const submitNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/product-roadmap/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPostTitle.trim() || null,
          content: newPostContent.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      setNewPostTitle("");
      setNewPostContent("");
      await loadComments();
    } catch (err) {
      setError('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parentId: number) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      
      const response = await fetch('/api/product-roadmap/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_comment_id: parentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create reply');
      }

      setReplyingTo(null);
      setReplyContent("");
      await loadComments();
    } catch (err) {
      setError('Failed to create reply');
    } finally {
      setSubmitting(false);
    }
  };

  const updateComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/product-roadmap/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          content: editContent.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      setEditingComment(null);
      setEditTitle("");
      setEditContent("");
      await loadComments();
    } catch (err) {
      setError('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await getAuthToken();
      
      const response = await fetch(`/api/product-roadmap/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      await loadComments();
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = comment.auth_id === user?.id;
    const isEditing = editingComment === comment.id;

    return (
      <Card key={comment.id} className={`${isReply ? 'ml-8 mt-4' : 'mb-6'} border border-gray-200 hover:border-gray-300 transition-colors`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {comment.user_profile?.username || 'Unknown User'}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatDate(comment.created_at)}
                {comment.updated_at !== comment.created_at && " (edited)"}
              </span>
            </div>
            {isOwner && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingComment(comment.id);
                    setEditTitle(comment.title || "");
                    setEditContent(comment.content);
                  }}
                  className="text-gray-600 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteComment(comment.id)}
                  className="text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              {comment.parent_comment_id === null && (
                <Input
                  placeholder="Title (optional)"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
              )}
              <Textarea
                placeholder="Edit your comment..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="border-gray-300 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateComment(comment.id)}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingComment(null);
                    setEditTitle("");
                    setEditContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {comment.title && (
                <h3 className="text-lg font-semibold mb-2 text-gray-800">{comment.title}</h3>
              )}
              <p className="whitespace-pre-wrap text-gray-700 mb-3">{comment.content}</p>
              
              {!isReply && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {replyingTo === comment.id ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                        className="border-gray-300 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => submitReply(comment.id)}
                          disabled={submitting || !replyContent.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {submitting ? 'Replying...' : 'Reply'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="border-l-2 border-gray-200 ml-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </Card>
    );
  };

  // Loading state
  if (loading || profileLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Product Roadmap</h2>
                <p className="text-gray-600">Verifying staff access and loading discussions...</p>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Access denied state
  if (!user || !profile || !isStaff) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-200 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Staff Access Required</h1>
                <p className="text-gray-600 mb-2">
                  This page is restricted to OTW Staff members only.
                </p>
                <p className="text-sm text-gray-500">
                  Contact an administrator if you believe you should have access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Product Roadmap</h1>
              <p className="text-gray-600">OTW Staff Discussion & Suggestions</p>
            </div>
            <Badge className="bg-blue-600 text-white ml-auto">
              Staff Only
            </Badge>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-red-600">{error}</p>
                </div>
                {debugMode && (
                  <Button 
                    onClick={testConnection} 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Test API Connection
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* New Post Form */}
          <Card className="mb-8 shadow-sm border border-gray-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="text-gray-800">Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={submitNewPost} className="space-y-4">
                <Input
                  placeholder="Title (optional)"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="border-gray-300 focus:border-blue-500"
                />
                <Textarea
                  placeholder="Share your thoughts, suggestions, or feedback..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
                <Button 
                  type="submit" 
                  disabled={submitting || !newPostContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Posting...
                    </>
                  ) : 'Post'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Comments List */}
          {loading ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading comments...</p>
              </CardContent>
            </Card>
          ) : comments.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">
                  No posts yet. Be the first to start a discussion!
                </p>
                <p className="text-sm text-gray-400">
                  Share your ideas, suggestions, or feedback to get the conversation started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}