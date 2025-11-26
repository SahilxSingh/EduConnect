"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { userAPI } from "@/lib/api";
import { Card, CardContent, CardHeader } from "../../_components/ui/card";
import { Button } from "../../_components/ui/button";
import { Textarea } from "../../_components/ui/textarea";
import { Input } from "../../_components/ui/input";
import { Badge } from "../../_components/ui/badge";
import { BookOpen, Users } from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const { userId: currentUserId, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");

  const userId = params.userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await userAPI.getUser(userId);
      setProfile(data);
      setBio(data.bio || "");
      setUsername(data.name || data.username || "");
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updateData = { bio, username, name: username };
      if (profile.role === "Teacher") {
        updateData.subjects = subjects;
      }
      await userAPI.updateProfile(userId, updateData);
      if (currentUserId === userId && user && username.trim()) {
        const [firstName, ...rest] = username.trim().split(" ");
        const clerkUpdate = { firstName };
        const lastName = rest.join(" ").trim();
        if (lastName) {
          clerkUpdate.lastName = lastName;
        }
        await user.update(clerkUpdate);
      }
      await loadProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const handleRemoveSubject = (subjectToRemove) => {
    setSubjects(subjects.filter(s => s !== subjectToRemove));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Profile not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                {(profile.name || profile.username)?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.name || profile.username || "User"}</h1>
                <p className="text-gray-500">{profile.email}</p>
                {profile.role && (
                  <Badge className="mt-2">{profile.role}</Badge>
                )}
              </div>
            </div>
            
            {isOwnProfile && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "outline" : "default"}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              {profile.role === "Teacher" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Subjects Taught</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Enter a subject (e.g., Mathematics)"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSubject();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddSubject} variant="outline">
                        Add
                      </Button>
                    </div>
                    {subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {subjects.map((subject, idx) => (
                          <Badge key={idx} variant="default" className="flex items-center gap-1">
                            {subject}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(subject)}
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Add subjects you teach. Click × to remove a subject.
                    </p>
                  </div>
                </div>
              )}
              
              <Button onClick={handleUpdateProfile}>Save Changes</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {profile.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Followers</p>
                    <p className="text-lg font-semibold">{profile.followersCount || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Following</p>
                    <p className="text-lg font-semibold">{profile.followingCount || 0}</p>
                  </div>
                </div>
              </div>
              
              {profile.role === "Student" && profile.course && (
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Course & Major</p>
                    <p className="font-semibold">{profile.course} - {profile.major}</p>
                  </div>
                </div>
              )}
              
              {profile.role === "Teacher" && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Subjects Taught</p>
                  {profile.subjects && profile.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.subjects.map((subject, idx) => (
                        <Badge key={idx}>{subject}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      No subjects added yet. Click "Edit Profile" to add subjects.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

