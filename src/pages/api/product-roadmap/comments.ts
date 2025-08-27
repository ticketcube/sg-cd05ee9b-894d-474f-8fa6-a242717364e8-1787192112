
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetComments(req, res);
  } else if (req.method === 'POST') {
    return handleCreateComment(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetComments(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get auth token from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify user is authenticated and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // ✅ SIMPLIFIED: Direct staff check using supabaseAdmin (bypasses RLS)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile check error:', profileError);
      return res.status(500).json({ error: 'Profile verification failed' });
    }

    if (!userProfile || userProfile.role !== 'otwstaff') {
      return res.status(403).json({ error: 'Staff access required' });
    }

    // ✅ FIXED: Fetch comments using supabaseAdmin to bypass RLS
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('product_roadmap_comments')
      .select(`
        id,
        auth_id,
        parent_comment_id,
        title,
        content,
        created_at,
        updated_at,
        user_profiles(username, role)
      `)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return res.status(500).json({ error: 'Failed to fetch comments', details: commentsError.message });
    }

    console.log('✅ Comments fetched successfully:', comments?.length || 0, 'comments');

    // Filter out comments without valid user profiles and organize into threads
    const validComments = comments?.filter(comment => comment.user_profiles) || [];
    console.log('✅ Valid comments with profiles:', validComments.length);
    
    const commentMap = new Map<number, Comment>();
    const topLevelComments: Comment[] = [];

    // First pass: create comment objects
    validComments.forEach((comment: any) => {
      const commentObj: Comment = {
        id: comment.id,
        auth_id: comment.auth_id,
        parent_comment_id: comment.parent_comment_id,
        title: comment.title,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user_profile: comment.user_profiles,
        replies: []
      };
      commentMap.set(comment.id, commentObj);
    });

    // Second pass: organize into threads
    commentMap.forEach((comment) => {
      if (comment.parent_comment_id === null) {
        topLevelComments.push(comment);
      } else {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies!.push(comment);
        }
      }
    });

    // Sort replies by creation date (oldest first)
    topLevelComments.forEach((comment) => {
      if (comment.replies) {
        comment.replies.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    });

    return res.status(200).json({ comments: topLevelComments });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

async function handleCreateComment(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { title, content, parent_comment_id } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get auth token from request
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Check if user is staff
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'otwstaff') {
      return res.status(403).json({ error: 'Staff access required' });
    }

    // If replying to a comment, verify parent exists
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from('product_roadmap_comments')
        .select('id')
        .eq('id', parent_comment_id)
        .single();

      if (parentError || !parentComment) {
        return res.status(400).json({ error: 'Parent comment not found' });
      }
    }

    // Create new comment
    const { data: newComment, error: insertError } = await supabaseAdmin
      .from('product_roadmap_comments')
      .insert({
        auth_id: user.id,
        title: parent_comment_id ? null : title, // Only top-level posts have titles
        content: content.trim(),
        parent_comment_id: parent_comment_id || null
      })
      .select(`
        id,
        auth_id,
        parent_comment_id,
        title,
        content,
        created_at,
        updated_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating comment:', insertError);
      return res.status(500).json({ error: 'Failed to create comment' });
    }

    return res.status(201).json({ comment: newComment });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}