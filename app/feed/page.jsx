"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { usePostStore } from "@/stores/postStore";
import { postAPI } from "@/lib/api";
import { CreatePost } from "../_components/posts/create-post";
import { PostCard } from "../_components/posts/post-card";

export default function FeedPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { posts, setPosts, setLoading, setError } = usePostStore();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    if (isSignedIn) {
      loadFeed();
    }
  }, [isSignedIn, isLoaded]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const feedData = await postAPI.getFeed();
      setPosts(feedData);
    } catch (error) {
      console.error("Error loading feed:", error);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6" color="red">College Feed</h1>
      
      <CreatePost />
      
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

