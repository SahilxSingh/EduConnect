"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useAssignmentStore } from "@/stores/assignmentStore";
import { useAuthStore } from "@/stores/authStore";
import { assignmentAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Badge } from "../_components/ui/badge";
import { Calendar, FileText } from "lucide-react";

export default function StudentAssignmentsPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const { assignments, setAssignments, setLoading } = useAssignmentStore();
  const { course, major } = useAuthStore();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    if (isSignedIn && course && major) {
      loadAssignments();
    }
  }, [isSignedIn, isLoaded, course, major]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await assignmentAPI.getStudentAssignments(course, major);
      setAssignments(data);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    try {
      await assignmentAPI.submitAssignment(assignmentId, {
        studentId: userId,
        submissionDetails: "Submitted",
      });
      alert("Assignment submitted successfully!");
      loadAssignments();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Failed to submit assignment");
    }
  };

  if (!isLoaded) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
  }

  if (!course || !major) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Please complete your profile to view assignments.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Your Assignments</h1>
      
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>No assignments available for your course and major.</p>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{assignment.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {assignment.details}
                    </CardDescription>
                  </div>
                  {assignment.submitted ? (
                    <Badge variant="default">Submitted</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {!assignment.submitted && (
                    <Button onClick={() => handleSubmit(assignment.id)}>
                      Mark as Submitted
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

