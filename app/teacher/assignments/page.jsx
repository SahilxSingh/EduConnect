"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useAssignmentStore } from "@/stores/assignmentStore";
import { assignmentAPI, courseAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../_components/ui/card";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Label } from "../../_components/ui/label";
import { Textarea } from "../../_components/ui/textarea";
import { Badge } from "../../_components/ui/badge";

export default function TeacherAssignmentsPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const { assignments, setAssignments, courses, setCourses, setLoading } = useAssignmentStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    course: "",
    major: "",
    title: "",
    details: "",
    dueDate: "",
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    if (isSignedIn) {
      loadCourses();
      loadAssignments();
    }
  }, [isSignedIn, isLoaded]);

  const loadCourses = async () => {
    try {
      const data = await courseAPI.getCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const teacherAssignments = await assignmentAPI.getTeacherAssignments(userId);
      setAssignments(teacherAssignments);
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assignmentAPI.createAssignment({
        teacherId: userId,
        ...formData,
      });
      
      alert("Assignment created successfully!");
      setShowForm(false);
      setFormData({
        course: "",
        major: "",
        title: "",
        details: "",
        dueDate: "",
      });
      loadAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment");
    }
  };

  const handleViewSubmissions = async (assignmentId) => {
    try {
      const submissions = await assignmentAPI.getSubmissions(assignmentId);
      if (submissions.length === 0) {
        alert("No submissions yet for this assignment.");
      } else {
        const submissionLines = submissions
          .map((s) => {
            const studentName = s.student?.name || s.student?.username || s.studentId;
            return `- ${studentName}: ${s.submissionDetails}`;
          })
          .join("\n");
        alert(`Total submissions: ${submissions.length}\n\nSubmissions:\n${submissionLines}`);
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
      alert("Failed to load submissions");
    }
  };

  if (!isLoaded) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Assignments</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create Assignment"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    required
                  />
                </div>
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
                <Label htmlFor="details">Details</Label>
                <Textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              
              <Button type="submit">Create Assignment</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>No assignments created yet.</p>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                <CardDescription>{assignment.details}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Badge>{assignment.course} - {assignment.major}</Badge>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => handleViewSubmissions(assignment.id)}>
                    View Submissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

