
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Comment ID is required' });
  }

  if (req.method === 'PUT') {
    return handleUpdateComment(req, res, parseInt(id));
  } else if (req.method === 'DELETE') {
    return handleDeleteComment(req, res, parseInt(id));
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleUpdateComment(req: NextApiRequest, res: NextApiResponse, commentId: number) {
  try {
    const { content, title } = req.body;

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

    if (profileError || !userProfile || userProfile.role !== 'staff') {
      return res.status(403).json({ error: 'Staff access required' });
    }

    // Verify the comment exists and belongs to the user
    const { data: existingComment, error: commentError } = await supabaseAdmin
      .from('product_roadmap_comments')
      .select('auth_id, parent_comment_id')
      .eq('id', commentId)
      .single();

    if (commentError || !existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.auth_id !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    // Update the comment
    const updateData: any = {
      content: content.trim(),
      updated_at: new Date().toISOString()
    };

    // Only update title for top-level comments (parent_comment_id is null)
    if (existingComment.parent_comment_id === null && title !== undefined) {
      updateData.title = title;
    }

    const { data: updatedComment, error: updateError } = await supabaseAdmin
      .from('product_roadmap_comments')
      .update(updateData)
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return res.status(500).json({ error: 'Failed to update comment' });
    }

    return res.status(200).json({ comment: updatedComment });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDeleteComment(req: NextApiRequest, res: NextApiResponse, commentId: number) {
  try {
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

    if (profileError || !userProfile || userProfile.role !== 'staff') {
      return res.status(403).json({ error: 'Staff access required' });
    }

    // Verify the comment exists
    const { data: existingComment, error: commentError } = await supabaseAdmin
      .from('product_roadmap_comments')
      .select('id, auth_id')
      .eq('id', commentId)
      .single();

    if (commentError || !existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Allow deletion if user owns the comment OR if user has admin privileges
    // For now, we'll allow staff to delete their own comments
    // Admin deletion can be added later if needed
    if (existingComment.auth_id !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Delete the comment (CASCADE will handle replies)
    const { error: deleteError } = await supabaseAdmin
      .from('product_roadmap_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }

    return res.status(200).json({ message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
