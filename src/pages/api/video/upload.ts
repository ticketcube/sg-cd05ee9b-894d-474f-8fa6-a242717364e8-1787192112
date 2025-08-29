
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import multiparty from 'multiparty';
import fs from 'fs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const supabaseServerClient = createServerSupabaseClient({ req, res });
    const { data: { session } } = await supabaseServerClient.auth.getSession();

    if (!session) {
        return res.status(401).json({ error: 'Unauthorized: You must be logged in to upload.' });
    }

    const form = new multiparty.Form();

    form.parse(req, async (error, fields, files) => {
        if (error) {
            console.error('Error parsing form:', error);
            return res.status(500).json({ error: 'Error processing upload form.' });
        }

        const videoFile = files.video?.[0];
        const artistName = fields.artistName?.[0] || 'Unknown Artist';
        const songTitle = fields.songTitle?.[0] || 'Unknown Title';

        if (!videoFile) {
            return res.status(400).json({ error: 'No video file provided.' });
        }
        
        // Limit file size to 100MB
        const maxSize = 100 * 1024 * 1024; 
        if (videoFile.size > maxSize) {
            fs.unlinkSync(videoFile.path); // Clean up temp file
            return res.status(413).json({ error: 'File is too large. Max size is 100MB.' });
        }

        const tempFilePath = videoFile.path;

        try {
            const fileBuffer = fs.readFileSync(tempFilePath);
            const fileExtension = videoFile.originalFilename.split('.').pop();
            const fileName = `${session.user.id}/${uuidv4()}.${fileExtension}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabaseAdmin.storage
                .from('video-submissions')
                .upload(fileName, fileBuffer, {
                    contentType: videoFile.headers['content-type'],
                    upsert: false,
                });

            if (uploadError) {
                console.error('Supabase storage upload error:', uploadError);
                throw new Error('Failed to upload video to storage.');
            }

            // Insert record into video_submissions table
            const { data: submissionData, error: dbError } = await supabaseAdmin
                .from('video_submissions')
                .insert({
                    user_id: session.user.id,
                    video_path: fileName,
                    artist_name: artistName,
                    song_title: songTitle,
                    status: 'pending'
                })
                .select()
                .single();

            if (dbError) {
                console.error('Supabase DB insert error:', dbError);
                // Attempt to delete the orphaned file from storage
                await supabaseAdmin.storage.from('video-submissions').remove([fileName]);
                throw new Error('Failed to save submission details to the database.');
            }

            return res.status(200).json({ message: 'Upload successful!', data: submissionData });
        } catch (err: any) {
            console.error('Video upload failed:', err);
            return res.status(500).json({ error: err.message || 'An unexpected error occurred during upload.' });
        } finally {
            // Clean up the temporary file
            fs.unlinkSync(tempFilePath);
        }
    });
};

export default handler;
