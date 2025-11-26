"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { useAuth } from "@/lib/useAuth";
import { usePostStore } from "@/stores/postStore";
import { postAPI } from "@/lib/api";

export function CreatePost() {
  const { userId } = useAuth();
  const { addPost } = usePostStore();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const newPost = await postAPI.createPost({
        userId,
        content,
        mediaUrl: mediaUrl || null,
      });

      // Reload the page to show the new post with all data
      window.location.reload();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <h3 className="text-lg font-semibold">Create a Post</h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          <Input
            type="url"
            placeholder="Add a image URL (optional)"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
