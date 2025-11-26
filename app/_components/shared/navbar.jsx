"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "../ui/button";
import { UserButton } from "@clerk/nextjs";
import { Home, BookOpen, MessageSquare, Bell, User, HelpCircle } from "lucide-react";

export function Navbar() {
  const { isSignedIn, userId } = useAuth();
  const { role } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          <Link href="/feed" className="text-xl font-bold text-blue-600">
            EduConnect
          </Link>
          
          {isSignedIn && (
            
            <div className="hidden md:flex items-center space-x-4 text-black">
              <Link href="/feed">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Feed
                </Button>
              </Link>
              
              <Link href={role === "Teacher" ? "/teacher/assignments" : "/assignments"}>
                <Button variant="ghost" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Assignments
                </Button>
              </Link>
              
              <Link href="/notices">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notices
                </Button>
              </Link>
              
              <Link href="/chat">
                <Button variant="ghost" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </Button>
              </Link>
              
              <Link href="/ask-doubt">
                <Button variant="ghost" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Ask a Doubt
                </Button>
              </Link>
              
              {userId && (
                <Link href={`/profile/${userId}`}>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Link href="/sign-up">
              <Button>Sign Up</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

