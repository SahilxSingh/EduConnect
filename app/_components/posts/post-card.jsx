"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { usePostStore } from "@/stores/postStore";
import { postAPI } from "@/lib/api";

export function PostCard({ post }) {
  const { userId } = useAuth();
  const { addLike, addComment } = usePostStore();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((like) => like.userId === userId) || false
  );

  const handleLike = async () => {
    try {
      // Get current user ID from auth
      const currentUserId = userId;
      const result = await postAPI.likePost(post.id, "like", currentUserId);
      
      if (result.liked) {
        const newLike = {
          id: Date.now().toString(),
          userId,
          postId: post.id,
          reactionType: "like",
        };
        addLike(post.id, newLike);
        setIsLiked(true);
      } else {
        // Unlike - remove from state
        setIsLiked(false);
        // Reload feed to update like count
        window.location.reload();
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await postAPI.addComment(post.id, {
        userId,
        content: commentText,
      });
      
      const newComment = {
        id: Date.now().toString(),
        userId,
        postId: post.id,
        content: commentText,
        createdAt: new Date().toISOString(),
      };
      
      addComment(post.id, newComment);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {(post.author?.name || post.author?.username)?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold">{post.author?.name || post.author?.username || "Unknown"}</p>
              <p className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="mb-4">{post.content}</p>
        
        {post.mediaUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}
        
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant={isLiked ? "default" : "ghost"}
            size="sm"
            onClick={handleLike}
            className="flex items-center gap-2"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            <span>{post.likes?.length || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments?.length || 0}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
        
        {showComments && (
          <div className="border-t pt-4 mt-4">
            <div className="space-y-3 mb-4">
              {post.comments?.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                    {(comment.user?.name || comment.user?.username)?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {comment.user?.name || comment.user?.username || "Unknown"}
                    </p>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleComment}>Post</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

