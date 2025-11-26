"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useNoticeStore } from "@/stores/noticeStore";
import { useAuthStore } from "@/stores/authStore";
import { noticeAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { Label } from "../_components/ui/label";
import { Textarea } from "../_components/ui/textarea";
import { Select } from "../_components/ui/select";
import { Badge } from "../_components/ui/badge";
import { Bell } from "lucide-react";

export default function NoticesPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const { notices, setNotices, setLoading } = useNoticeStore();
  const { role } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "Notice",
    title: "",
    content: "",
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    if (isSignedIn) {
      loadNotices();
    }
  }, [isSignedIn, isLoaded]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await noticeAPI.getNotices();
      setNotices(data);
    } catch (error) {
      console.error("Error loading notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await noticeAPI.createNotice({
        authorId: userId,
        ...formData,
      });
      
      alert("Notice/Event created successfully!");
      setShowForm(false);
      setFormData({
        type: "Notice",
        title: "",
        content: "",
      });
      loadNotices();
    } catch (error) {
      console.error("Error creating notice:", error);
      alert("Failed to create notice/event");
    }
  };

  const canCreateNotice = role === "Teacher";

  if (!isLoaded) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notices & Events</h1>
        {canCreateNotice && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Create Notice/Event"}
          </Button>
        )}
      </div>

      {showForm && canCreateNotice && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Notice or Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="Notice">Notice</option>
                  <option value="Event">Event</option>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>
              
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {notices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>No notices or events available.</p>
            </CardContent>
          </Card>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <Badge variant={notice.type === "Event" ? "default" : "secondary"}>
                        {notice.type}
                      </Badge>
                    </div>
                    <CardTitle>{notice.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{notice.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

