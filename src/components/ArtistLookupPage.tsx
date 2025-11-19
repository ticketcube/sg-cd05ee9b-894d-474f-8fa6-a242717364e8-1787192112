
import React, { useState, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import { artistService } from "@/services/artistService";
import type { Artist } from "@/types/artists";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Edit, Trash2, Plus, Eye, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ArtistFormData {
  artist_name: string;
  artist_home: string;
  artist_genre: string;
  artist_videolink: string;
  artist_audiolink: string;
  artist_image: string;
  artist_bio: string;
  artist_tiktok_username: string;
  artist_tiktok_videoid: string;
  artist_otwcategory: string;
  primary_vibe: string;
  secondary_vibe: string;
  Top_List: string;
  artist_otwcoverage: number;
}

const initialFormData: ArtistFormData = {
  artist_name: "",
  artist_home: "",
  artist_genre: "",
  artist_videolink: "",
  artist_audiolink: "",
  artist_image: "",
  artist_bio: "",
  artist_tiktok_username: "",
  artist_tiktok_videoid: "",
  artist_otwcategory: "",
  primary_vibe: "",
  secondary_vibe: "",
  Top_List: "",
  artist_otwcoverage: 0,
};

export function ArtistLookupPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [formData, setFormData] = useState<ArtistFormData>(initialFormData);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [weeklyListId, setWeeklyListId] = useState("");
    const [addingToList, setAddingToList] = useState(false);
    const [filterMode, setFilterMode] = useState < 'none' | 'no_genre' | 'no_home_city' | 'no_top_list' > ('none');
    const [campaignFilterActive, setCampaignFilterActive] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const results = await artistService.searchArtists(query, 10);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Campaign filter effect - fetches artists based on filter mode
useEffect(() => {
  const fetchFilteredArtists = async () => {
    if (!campaignFilterActive || filterMode === 'none') {
      return;
    }

    try {
      setLoading(true);
      const { supabase } = await import("@/integrations/supabase/client");
      
      let query = supabase
        .from('artists')
        .select('*')
        .order('artist_name', { ascending: true })
        .limit(50);

      // Apply the appropriate filter based on filterMode
      if (filterMode === 'no_genre') {
        query = query.or('artist_genre.is.null,artist_genre.eq.');
      } else if (filterMode === 'no_home_city') {
        query = query.or('artist_home.is.null,artist_home.eq.');
      } else if (filterMode === 'no_top_list') {
        query = query.or('top_list.is.null,top_list.eq.');
      }

      const { data, error } = await query;

      if (error) {
        console.error("Filter error:", error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error("Campaign filter error:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  fetchFilteredArtists();
}, [campaignFilterActive, filterMode]);

  const handleArtistSelect = (artist: Artist) => {
    setSelectedArtist(artist);
    setFormData({
      artist_name: artist.artist_name || "",
      artist_home: artist.artist_home || "",
      artist_genre: artist.artist_genre || "",
      artist_videolink: artist.artist_videolink || "",
      artist_audiolink: artist.artist_audiolink || "",
      artist_image: artist.artist_image || "",
      artist_bio: artist.artist_bio || "",
      artist_tiktok_username: artist.artist_tiktok_username || "",
      artist_tiktok_videoid: artist.artist_tiktok_videoid || "",
      artist_otwcategory: artist.artist_otwcategory || "",
      primary_vibe: artist.primary_vibe || "",
      secondary_vibe: artist.secondary_vibe || "",
      Top_List: artist.top_list || "",
      artist_otwcoverage: artist.artist_otwcoverage || 0,
    });
  };

  const handleFormChange = (field: keyof ArtistFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (createMode) {
        const newArtist = await artistService.createArtist(formData);
        setSelectedArtist(newArtist);
        setCreateMode(false);
        alert("Artist created successfully!");
      } else if (selectedArtist) {
        const updatedArtist = await artistService.updateArtist(selectedArtist.uuid, formData);
        setSelectedArtist(updatedArtist);
        setEditMode(false);
        alert("Artist updated successfully!");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving artist. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selectedArtist) return;

    try {
      await artistService.deleteArtist(selectedArtist.uuid);
      setSelectedArtist(null);
      setSearchResults(prev => prev.filter(a => a.uuid !== selectedArtist.uuid));
      alert("Artist deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting artist. Please try again.");
    }
  };

  const resetToCreateMode = () => {
    setSelectedArtist(null);
    setEditMode(false);
    setCreateMode(true);
    setFormData(initialFormData);
  };

  const resetToViewMode = () => {
    setEditMode(false);
    setCreateMode(false);
  };

  const handleAddToWeeklyList = async () => {
    if (!selectedArtist || !weeklyListId.trim()) return;

    try {
      setAddingToList(true);
      
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data, error } = await supabase
        .from("weekly_list_artists")
        .insert([
          {
            artist_uuid: selectedArtist.uuid,
            weekly_list_id: parseInt(weeklyListId),
            position: 0,
            week_identifier: null
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      setWeeklyListId("");
      alert(`Successfully added ${selectedArtist.artist_name} to weekly list ${weeklyListId}!`);
      
    } catch (error) {
      console.error("Error adding artist to weekly list:", error);
      alert("Error adding artist to weekly list. Please try again.");
    } finally {
      setAddingToList(false);
    }
  };

  // Validation function for required fields
  const isFormValid = () => {
    return (
      formData.artist_name.trim() !== "" &&
      formData.artist_home.trim() !== "" &&
      formData.artist_genre.trim() !== "" &&
      formData.artist_videolink.trim() !== "" &&
      formData.Top_List.trim() !== ""
    );
  };

  const isEditing = editMode || createMode;
  const canSave = isFormValid();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
       <div className="space-y-6 mb-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Artist Lookup
          </h1>
          <p className="text-gray-400 mt-2">Search, view, and manage artist profiles</p>
        </div>
        
        <Button 
          onClick={resetToCreateMode}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Artist
        </Button>
      </div>

    {/* Q4 2025 Campaign Section */}
    <Card className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-orange-500/30">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-orange-400">
            🎯 ARTIST Q4 2025 UPDATE CAMPAIGN
          </CardTitle>
          <p className="text-gray-300 text-sm">
            Please help us complete Genres, Home Cities and Vibes for our Artist Database
          </p>
          <p className="text-gray-400 text-xs">
            Click one of these buttons and the dropdown below will filter for Artists for whom we need info.
          </p>
          <p className="text-yellow-400 text-xs font-medium">
            We need Genres and Home Cities. Vibes and Top_List are optional.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={filterMode === 'no_genre' ? 'default' : 'outline'}
            onClick={() => {
              if (filterMode === 'no_genre') {
                setFilterMode('none');
                setCampaignFilterActive(false);
              } else {
                setFilterMode('no_genre');
                setCampaignFilterActive(true);
              }
            }}
            className={filterMode === 'no_genre' 
              ? 'bg-orange-600 hover:bg-orange-700' 
              : 'border-orange-500 text-orange-400 hover:bg-orange-900/30'
            }
          >
            {filterMode === 'no_genre' ? '✓ ' : ''}NO GENRE
          </Button>

          <Button
            variant={filterMode === 'no_home_city' ? 'default' : 'outline'}
            onClick={() => {
              if (filterMode === 'no_home_city') {
                setFilterMode('none');
                setCampaignFilterActive(false);
              } else {
                setFilterMode('no_home_city');
                setCampaignFilterActive(true);
              }
            }}
            className={filterMode === 'no_home_city' 
              ? 'bg-orange-600 hover:bg-orange-700' 
              : 'border-orange-500 text-orange-400 hover:bg-orange-900/30'
            }
          >
            {filterMode === 'no_home_city' ? '✓ ' : ''}NO HOME CITY
          </Button>

          <Button
            variant={filterMode === 'no_top_list' ? 'default' : 'outline'}
            onClick={() => {
              if (filterMode === 'no_top_list') {
                setFilterMode('none');
                setCampaignFilterActive(false);
              } else {
                setFilterMode('no_top_list');
                setCampaignFilterActive(true);
              }
            }}
            className={filterMode === 'no_top_list' 
              ? 'bg-orange-600 hover:bg-orange-700' 
              : 'border-orange-500 text-orange-400 hover:bg-orange-900/30'
            }
          >
            {filterMode === 'no_top_list' ? '✓ ' : ''}NO TOP LIST
          </Button>

          {campaignFilterActive && (
            <Badge variant="secondary" className="bg-orange-600 text-white px-3 py-1">
              Filter Active
            </Badge>
             )}
      </div>

      {/* Filtered Artists Dropdown - Shows when campaign filter is active */}
      {campaignFilterActive && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-orange-300 font-semibold">
              Artists Missing {filterMode === 'no_genre' ? 'Genre' : filterMode === 'no_home_city' ? 'Home City' : 'Top List'} Data
            </Label>
            <Badge variant="secondary" className="bg-orange-700 text-white">
              {searchResults.length} found
            </Badge>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-900/50 rounded-lg p-3 border border-orange-500/30">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-400 mt-2 text-sm">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No artists found with missing {filterMode === 'no_genre' ? 'genre' : filterMode === 'no_home_city' ? 'home city' : 'top list'} data
              </div>
            ) : (
              searchResults.map((artist) => (
                <div
                  key={artist.uuid}
                  onClick={() => handleArtistSelect(artist)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedArtist?.uuid === artist.uuid
                      ? "bg-orange-900/70 border border-orange-400"
                      : "bg-gray-800/70 hover:bg-gray-700/70"
                  }`}
                >
                  <div className="font-medium text-white">{artist.artist_name}</div>
                  <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-2">
                    {!artist.artist_genre && (
                      <Badge variant="outline" className="border-red-500 text-red-400 text-xs">
                        No Genre
                      </Badge>
                    )}
                    {!artist.artist_home && (
                      <Badge variant="outline" className="border-red-500 text-red-400 text-xs">
                        No Home City
                      </Badge>
                    )}
                    {!artist.top_list && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">
                        No Top List
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Search Panel */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Search className="w-5 h-5 mr-2" />
                  Search Artists
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by artist name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                  {loading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((artist) => (
                    <div
                      key={artist.uuid}
                      onClick={() => handleArtistSelect(artist)}
                      className={`text-white p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedArtist?.uuid === artist.uuid
                          ? "bg-purple-900/50 border border-purple-500"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      <div className="font-medium">{artist.artist_name}</div>
                      <div className="text-sm text-white">
                        {artist.artist_home && `${artist.artist_home} • `}
                        {artist.artist_genre}
                      </div>
                    </div>
                  ))}
                  {searchQuery && !loading && searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No artists found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add to Weekly List Panel - MOVED HERE */}
            {selectedArtist && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-400">
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Weekly List
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Selected Artist</Label>
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                      <div className="font-medium text-white">{selectedArtist.artist_name}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        UUID: {selectedArtist.uuid}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="weekly_list_id" className="text-white">Weekly List ID</Label>
                    <Input
                      id="weekly_list_id"
                      type="number"
                      value={weeklyListId}
                      onChange={(e) => setWeeklyListId(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Enter weekly list ID number..."
                    />
                  </div>

                  <Button 
                    onClick={handleAddToWeeklyList}
                    disabled={!weeklyListId.trim() || addingToList}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {addingToList ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Weekly List
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Artist Details/Edit (shows when artist selected or in create mode) */}
          {(selectedArtist || createMode) && (
            <Card className="bg-gray-900 border-gray-700 lg:sticky lg:top-6 h-fit">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-white">
                    <Eye className="w-5 h-5 mr-2" />
                    {createMode ? "Create New Artist" : "Artist Details"}
                  </CardTitle>
                  
                  {selectedArtist && !isEditing && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(true)}
                        className="border-gray-600 hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-gray-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Artist</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-300">
                              Are you sure you want to delete "{selectedArtist.artist_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetToViewMode}
                        className="border-gray-600 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!canSave}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="artist_name" className="text-white">
                        Artist Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="artist_name"
                        value={formData.artist_name}
                        onChange={(e) => handleFormChange("artist_name", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                    
                    {selectedArtist && (
                      <div>
                        <Label htmlFor="artist_uuid" className="text-white">UUID</Label>
                        <div className="relative">
                          <Input
                            id="artist_uuid"
                            value={selectedArtist.uuid}
                            readOnly
                            className="bg-gray-700 border-gray-600 text-gray-300 cursor-text"
                            title="Click to select UUID for copying"
                            onClick={(e) => e.currentTarget.select()}
                          />
                          <Badge 
                            variant="secondary" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-600 text-gray-300"
                          >
                            Read-only
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="artist_home" className="text-white">
                        Home City <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="artist_home"
                        value={formData.artist_home}
                        onChange={(e) => handleFormChange("artist_home", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="artist_genre" className="text-white">
                        Genre <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="artist_genre"
                        value={formData.artist_genre}
                        onChange={(e) => handleFormChange("artist_genre", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="artist_otwcategory" className="text-white">OTW Category</Label>
                      <Input
                        id="artist_otwcategory"
                        value={formData.artist_otwcategory}
                        onChange={(e) => handleFormChange("artist_otwcategory", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="artist_bio" className="text-white">Bio</Label>
                    <Textarea
                      id="artist_bio"
                      value={formData.artist_bio}
                      onChange={(e) => handleFormChange("artist_bio", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white min-h-20"
                      placeholder="Artist biography..."
                    />
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary_vibe" className="text-white">Primary Vibe</Label>
                      <Input
                        id="primary_vibe"
                        value={formData.primary_vibe}
                        onChange={(e) => handleFormChange("primary_vibe", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="secondary_vibe" className="text-white">Secondary Vibe</Label>
                      <Input
                        id="secondary_vibe"
                        value={formData.secondary_vibe}
                        onChange={(e) => handleFormChange("secondary_vibe", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="Top_List" className="text-white">
                        Top List <span className="text-red-400">*</span>
                      </Label>
                      {isEditing ? (
                        <Select
                          value={formData.Top_List}
                          onValueChange={(value) => handleFormChange("Top_List", value)}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Select a list..." />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="RisingStar" className="text-white hover:bg-gray-700">RisingStar</SelectItem>
                            <SelectItem value="Featured" className="text-white hover:bg-gray-700">Featured</SelectItem>
                            <SelectItem value="ClassOf" className="text-white hover:bg-gray-700">ClassOf</SelectItem>
                            <SelectItem value="Groover" className="text-white hover:bg-gray-700">Groover</SelectItem>
                            <SelectItem value="StaffPick" className="text-white hover:bg-gray-700">StaffPick</SelectItem>
                            <SelectItem value="2026New" className="text-white hover:bg-gray-700">2026New</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="Top_List"
                          value={formData.Top_List}
                          disabled
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="artist_otwcoverage" className="text-white">Class of (e.g. 2020)</Label>
                      <Input
                        id="artist_otwcoverage"
                        type="number"
                        value={formData.artist_otwcoverage}
                        onChange={(e) => handleFormChange("artist_otwcoverage", parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <Label htmlFor="artist_videolink" className="text-white">
                      Video Link <span className="text-red-400">*</span>
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="artist_videolink"
                        value={formData.artist_videolink}
                        onChange={(e) => handleFormChange("artist_videolink", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="https://..."
                      />
                      {formData.artist_videolink && !isEditing && (
                        <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 hover:bg-gray-700 shrink-0"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">{selectedArtist?.artist_name} - Video</DialogTitle>
                            </DialogHeader>
                            <div className="aspect-video">
                              <iframe
                                src={formData.artist_videolink}
                                className="w-full h-full rounded-lg"
                                allowFullScreen
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="artist_audiolink" className="text-white">Audio Link</Label>
                    <Input
                      id="artist_audiolink"
                      value={formData.artist_audiolink}
                      onChange={(e) => handleFormChange("artist_audiolink", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="artist_image" className="text-white">Image URL</Label>
                    <Input
                      id="artist_image"
                      value={formData.artist_image}
                      onChange={(e) => handleFormChange("artist_image", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="artist_tiktok_username" className="text-white">TikTok Username</Label>
                      <Input
                        id="artist_tiktok_username"
                        value={formData.artist_tiktok_username}
                        onChange={(e) => handleFormChange("artist_tiktok_username", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="@username"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="artist_tiktok_videoid" className="text-white">TikTok Video ID</Label>
                      <Input
                        id="artist_tiktok_videoid"
                        value={formData.artist_tiktok_videoid}
                        onChange={(e) => handleFormChange("artist_tiktok_videoid", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
