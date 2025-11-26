"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { Label } from "../_components/ui/label";
import { Select } from "../_components/ui/select";
import { authAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function OnboardingPage() {
  const { userId, email } = useAuth();
  const router = useRouter();
  const { setUserRole } = useAuthStore();
  const [role, setRole] = useState("");
  const [course, setCourse] = useState("");
  const [major, setMajor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Please sign in first");
      router.push("/sign-up");
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        email,
        userId,
        role,
        course: role === "Student" ? course : null,
        major: role === "Student" ? major : null,
      });

      setUserRole(role, course, major);
      router.push("/feed");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to complete registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Tell us about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select role</option>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
              </Select>
            </div>

            {role === "Student" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g., B.Tech, B.Sc"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

