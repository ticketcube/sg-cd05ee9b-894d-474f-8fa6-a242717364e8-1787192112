
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface TicketCube {
  id: string;
  user_id: string | null;
  title: string;
  description?: string;
  event_name?: string;
  venue?: string;
  event_date?: string;
  cube_type: "standard" | "spectix";
  is_secured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CubeFaceData {
  id: string;
  ticketcube_id: string;
  face_number: number;
  content_type: "image" | "text";
  content_text?: string;
  image_url?: string;
  face_title?: string;
  created_at: string;
}

export interface CreateTicketCubeData {
  title: string;
  description?: string;
  event_name?: string;
  venue?: string;
  event_date?: string;
  cube_type: "standard" | "spectix";
  faces: Array<{
    face_number: number;
    content_type: "image" | "text";
    content_text?: string;
    image_url?: string;
    face_title?: string;
  }>;
}

export class TicketCubeService {
  async createTicketCube(authUserId: string, cubeData: CreateTicketCubeData): Promise<TicketCube> {
    try {
      // Verify we have a current authenticated session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error("Authentication required. Please sign in to create a TicketCube.");
      }

      // Ensure the passed authUserId matches the current session
      if (session.user.id !== authUserId) {
        throw new Error("Authentication mismatch. Please refresh and try again.");
      }

      // Insert the main ticketcube record
      const { data: cubeRecord, error: cubeError } = await supabase
        .from("ticketcubes")
        .insert({
          user_id: session.user.id, // Use the authenticated user's UUID
          title: cubeData.title,
          description: cubeData.description,
          event_name: cubeData.event_name,
          venue: cubeData.venue,
          event_date: cubeData.event_date,
          cube_type: cubeData.cube_type,
          is_secured: false
        })
        .select()
        .single();

      if (cubeError) {
        console.error("Error creating ticketcube:", cubeError);
        throw cubeError;
      }

      // Insert the cube faces
      if (cubeData.faces && cubeData.faces.length > 0) {
        const facesToInsert = cubeData.faces.map(face => ({
          ticketcube_id: cubeRecord.id,
          face_number: face.face_number,
          content_type: face.content_type,
          content_text: face.content_text,
          image_url: face.image_url,
          face_title: face.face_title
        }));

        const { error: facesError } = await supabase
          .from("cube_faces")
          .insert(facesToInsert);

        if (facesError) {
          console.error("Error creating cube faces:", facesError);
          // Clean up the cube record if faces failed
          await supabase.from("ticketcubes").delete().eq("id", cubeRecord.id);
          throw facesError;
        }
      }

      return cubeRecord as TicketCube;
    } catch (error) {
      console.error("Unexpected error in createTicketCube:", error);
      throw error;
    }
  }

  async getTicketCube(cubeId: string, userId?: string): Promise<{ cube: TicketCube; faces: CubeFaceData[] } | null> {
    try {
      let cubeQuery = supabase
        .from("ticketcubes")
        .select("*")
        .eq("id", cubeId);

      if (userId) {
        cubeQuery = cubeQuery.eq("user_id", userId);
      }

      const { data: cubeData, error: cubeError } = await cubeQuery.single();

      if (cubeError) {
        if (cubeError.code === "PGRST116") {
          return null; // Not found
        }
        console.error("Error fetching ticketcube:", cubeError);
        throw cubeError;
      }

      // Fetch associated faces
      const { data: facesData, error: facesError } = await supabase
        .from("cube_faces")
        .select("*")
        .eq("ticketcube_id", cubeId)
        .order("face_number", { ascending: true });

      if (facesError) {
        console.error("Error fetching cube faces:", facesError);
        throw facesError;
      }

      return {
        cube: cubeData as TicketCube,
        faces: facesData as CubeFaceData[]
      };
    } catch (error) {
      console.error("Unexpected error in getTicketCube:", error);
      throw error;
    }
  }

  async getUserTicketCubes(userId: string, page: number = 1, limit: number = 10): Promise<{ cubes: TicketCube[]; count: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("ticketcubes")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching user ticketcubes:", error);
        throw error;
      }

      return {
        cubes: data as TicketCube[],
        count: count || 0
      };
    } catch (error) {
      console.error("Unexpected error in getUserTicketCubes:", error);
      return { cubes: [], count: 0 };
    }
  }

  async updateTicketCube(cubeId: string, userId: string, updates: Partial<CreateTicketCubeData>): Promise<TicketCube> {
    try {
      const { faces, ...cubeUpdates } = updates;

      // Update the main cube record
      const { data: updatedCube, error: cubeError } = await supabase
        .from("ticketcubes")
        .update({
          ...cubeUpdates,
          updated_at: new Date().toISOString()
        })
        .eq("id", cubeId)
        .eq("user_id", userId)
        .select()
        .single();

      if (cubeError) {
        console.error("Error updating ticketcube:", cubeError);
        throw cubeError;
      }

      // Update faces if provided
      if (faces && faces.length > 0) {
        // Delete existing faces first
        const { error: deleteError } = await supabase
          .from("cube_faces")
          .delete()
          .eq("ticketcube_id", cubeId);

        if (deleteError) {
          console.error("Error deleting old cube faces:", deleteError);
          throw deleteError;
        }

        // Insert new faces
        const facesToInsert = faces.map(face => ({
          ticketcube_id: cubeId,
          face_number: face.face_number,
          content_type: face.content_type,
          content_text: face.content_text,
          image_url: face.image_url,
          face_title: face.face_title
        }));

        const { error: insertError } = await supabase
          .from("cube_faces")
          .insert(facesToInsert);

        if (insertError) {
          console.error("Error inserting new cube faces:", insertError);
          throw insertError;
        }
      }

      return updatedCube as TicketCube;
    } catch (error) {
      console.error("Unexpected error in updateTicketCube:", error);
      throw error;
    }
  }

  async secureTicketCube(cubeId: string, userId: string): Promise<TicketCube> {
    try {
      const { data: securedCube, error } = await supabase
        .from("ticketcubes")
        .update({
          is_secured: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", cubeId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error securing ticketcube:", error);
        throw error;
      }

      return securedCube as TicketCube;
    } catch (error) {
      console.error("Unexpected error in secureTicketCube:", error);
      throw error;
    }
  }

  async deleteTicketCube(cubeId: string, userId: string): Promise<boolean> {
    try {
      // Delete faces first (cascade should handle this, but being explicit)
      const { error: facesError } = await supabase
        .from("cube_faces")
        .delete()
        .eq("ticketcube_id", cubeId);

      if (facesError) {
        console.error("Error deleting cube faces:", facesError);
        throw facesError;
      }

      // Delete the cube
      const { error: cubeError } = await supabase
        .from("ticketcubes")
        .delete()
        .eq("id", cubeId)
        .eq("user_id", userId);

      if (cubeError) {
        console.error("Error deleting ticketcube:", cubeError);
        throw cubeError;
      }

      return true;
    } catch (error) {
      console.error("Unexpected error in deleteTicketCube:", error);
      return false;
    }
  }

  async uploadImage(file: File, userId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      // Use the user's auth UUID for the folder path to ensure uniqueness
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('ticketcube-images')
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading image:", error);
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('ticketcube-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Unexpected error in uploadImage:", error);
      throw error;
    }
  }

  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract the file path from the URL
      const url = new URL(imageUrl);
      const path = url.pathname.split('/').pop();
      
      if (!path) {
        console.error("Could not extract file path from URL:", imageUrl);
        return false;
      }

      const { error } = await supabase.storage
        .from('ticketcube-images')
        .remove([path]);

      if (error) {
        console.error("Error deleting image:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Unexpected error in deleteImage:", error);
      return false;
    }
  }
}

export const ticketCubeService = new TicketCubeService();