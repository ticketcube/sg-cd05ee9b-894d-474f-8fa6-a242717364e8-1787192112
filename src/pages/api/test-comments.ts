
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 [TEST API] Starting test endpoint...');
  
  try {
    // Test 1: Check if we can connect to supabase at all
    console.log('🧪 [TEST API] Test 1: Basic supabase connection...');
    const { data: testConnection, error: connectionError } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ [TEST API] Supabase connection failed:', connectionError);
      return res.status(500).json({ 
        test: 'connection',
        success: false,
        error: connectionError.message 
      });
    }
    
    console.log('✅ [TEST API] Supabase connection works');

    // Test 2: Check if product_roadmap_comments table exists
    console.log('🧪 [TEST API] Test 2: Check if table exists...');
    const { data: tableTest, error: tableError } = await supabaseAdmin
      .from('product_roadmap_comments')
      .select('count')
      .limit(1);
      
    if (tableError) {
      console.error('❌ [TEST API] Table does not exist:', tableError);
      return res.status(200).json({
        test: 'table_existence',
        success: false,
        error: tableError.message,
        hint: 'You need to create the product_roadmap_comments table first'
      });
    }
    
    console.log('✅ [TEST API] Table exists');

    // Test 3: Try to fetch any comments
    console.log('🧪 [TEST API] Test 3: Fetch comments...');
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('product_roadmap_comments')
      .select('*')
      .limit(5);
      
    if (commentsError) {
      console.error('❌ [TEST API] Comments fetch failed:', commentsError);
      return res.status(200).json({
        test: 'fetch_comments',
        success: false,
        error: commentsError.message
      });
    }
    
    console.log('✅ [TEST API] Comments fetch successful. Count:', comments?.length || 0);

    // Test 4: Check user_profiles table for join capability
    console.log('🧪 [TEST API] Test 4: Check user_profiles join...');
    const { data: profilesTest, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('auth_id, username, role')
      .limit(3);
      
    if (profilesError) {
      console.error('❌ [TEST API] Profiles fetch failed:', profilesError);
      return res.status(200).json({
        test: 'fetch_profiles',
        success: false,
        error: profilesError.message
      });
    }
    
    console.log('✅ [TEST API] Profiles fetch successful. Count:', profilesTest?.length || 0);

    return res.status(200).json({
      success: true,
      message: 'All tests passed',
      results: {
        supabase_connection: true,
        table_exists: true,
        comments_count: comments?.length || 0,
        profiles_count: profilesTest?.length || 0,
        sample_comment: comments?.[0] || null,
        sample_profile: profilesTest?.[0] || null
      }
    });

  } catch (error) {
    console.error('🚨 [TEST API] Unexpected error:', error);
    return res.status(500).json({
      test: 'unexpected_error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
