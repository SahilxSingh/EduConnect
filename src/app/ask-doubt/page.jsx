"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { queryAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Textarea } from "../_components/ui/textarea";
import { Label } from "../_components/ui/label";
import { Select } from "../_components/ui/select";
import { Badge } from "../_components/ui/badge";
import { HelpCircle, Send } from "lucide-react";

export default function AskDoubtPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [queryText, setQueryText] = useState("");
  const [submittedQueries, setSubmittedQueries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    // In a real app, you'd fetch the list of teachers here
    // For now, we'll use a placeholder
    setTeachers([
      { id: "1", name: "Dr. Smith", subject: "Mathematics" },
      { id: "2", name: "Prof. Johnson", subject: "Computer Science" },
    ]);
  }, [isSignedIn, isLoaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!queryText.trim() || !selectedTeacher) {
      alert("Please select a teacher and enter your query");
      return;
    }

    setLoading(true);
    try {
      await queryAPI.submitQuery({
        studentId: userId,
        teacherId: selectedTeacher,
        queryText,
      });
      
      const newQuery = {
        id: Date.now().toString(),
        teacherId: selectedTeacher,
        teacherName: teachers.find((t) => t.id === selectedTeacher)?.name,
        queryText,
        answered: false,
        createdAt: new Date().toISOString(),
      };
      
      setSubmittedQueries([newQuery, ...submittedQueries]);
      setQueryText("");
      setSelectedTeacher("");
      alert("Query submitted successfully!");
    } catch (error) {
      console.error("Error submitting query:", error);
      alert("Failed to submit query. Please try again.");
    } finally {
      setLoading(false);
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
      <div className="flex items-center space-x-2 mb-6">
        <HelpCircle className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Ask a Doubt</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Submit Your Query</CardTitle>
          <CardDescription>
            Select a teacher and ask your question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teacher">Select Teacher</Label>
              <Select
                id="teacher"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                required
              >
                <option value="">Choose a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.subject}
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="query">Your Question</Label>
              <Textarea
                id="query"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                rows={6}
                placeholder="Type your question here..."
                required
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Submitting..." : "Submit Query"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {submittedQueries.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Queries</h2>
          <div className="space-y-4">
            {submittedQueries.map((query) => (
              <Card key={query.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{query.teacherName}</CardTitle>
                    <Badge variant={query.answered ? "default" : "outline"}>
                      {query.answered ? "Answered" : "Pending"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(query.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{query.queryText}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

