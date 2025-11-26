"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { queryAPI, userAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Textarea } from "../_components/ui/textarea";
import { Label } from "../_components/ui/label";
import { Select } from "../_components/ui/select";
import { Badge } from "../_components/ui/badge";
import { HelpCircle, Send, MessageSquare } from "lucide-react";

export default function AskDoubtPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const { role } = useAuthStore();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [queryText, setQueryText] = useState("");
  const [submittedQueries, setSubmittedQueries] = useState([]);
  const [teacherQueries, setTeacherQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answerText, setAnswerText] = useState({});

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    if (isSignedIn) {
      if (role === "Student") {
        loadTeachers();
        loadStudentQueries();
      } else if (role === "Teacher") {
        loadTeacherQueries();
      }
    }
  }, [isSignedIn, isLoaded, role, userId]);

  const loadTeachers = async () => {
    try {
      const teacherList = await userAPI.getTeachers();
      setTeachers(teacherList);
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const loadStudentQueries = async () => {
    if (!userId) return;
    try {
      const queries = await queryAPI.getStudentQueries(userId);
      setSubmittedQueries(queries);
    } catch (error) {
      console.error("Error loading student queries:", error);
    }
  };

  const loadTeacherQueries = async () => {
    try {
      const queries = await queryAPI.getTeacherQueries(userId);
      setTeacherQueries(queries);
    } catch (error) {
      console.error("Error loading teacher queries:", error);
    }
  };

  const handleSubmitQuery = async (e) => {
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
      
      setQueryText("");
      setSelectedTeacher("");
      alert("Query submitted successfully!");
      loadStudentQueries();
    } catch (error) {
      console.error("Error submitting query:", error);
      alert("Failed to submit query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuery = async (queryId) => {
    const answer = answerText[queryId];
    if (!answer || !answer.trim()) {
      alert("Please enter an answer");
      return;
    }

    setLoading(true);
    try {
      await queryAPI.answerQuery(queryId, {
        teacherId: userId,
        answer,
      });

      setAnswerText({ ...answerText, [queryId]: "" });
      alert("Answer submitted successfully!");
      loadTeacherQueries();
    } catch (error) {
      console.error("Error answering query:", error);
      alert("Failed to submit answer. Please try again.");
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

  // Student View - Submit Queries
  if (role === "Student") {
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
            <form onSubmit={handleSubmitQuery} className="space-y-4">
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
                      {teacher.name} ({teacher.email})
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
                      <CardTitle className="text-lg">To: {query.teacherName}</CardTitle>
                      <Badge variant={query.answered ? "default" : "outline"}>
                        {query.answered ? "Answered" : "Pending"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(query.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold mb-1">Your Question:</p>
                        <p className="text-gray-700">{query.queryText}</p>
                      </div>
                      {query.answered && query.answer && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="font-semibold mb-1">Answer:</p>
                          <p className="text-gray-700">{query.answer}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Answered on {new Date(query.answeredAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Teacher View - Answer Queries
  if (role === "Teacher") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center space-x-2 mb-6">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Answer Student Queries</h1>
        </div>

        {teacherQueries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>No queries from students yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {teacherQueries.map((query) => (
              <Card key={query.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Query from {query.student?.name || query.student?.username || "Student"}
                      </CardTitle>
                      <CardDescription>
                        {new Date(query.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={query.answered ? "default" : "outline"}>
                      {query.answered ? "Answered" : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">Question:</p>
                      <p className="text-gray-700">{query.queryText}</p>
                    </div>
                    
                    {query.answered && query.answer ? (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="font-semibold mb-2">Your Answer:</p>
                        <p className="text-gray-700">{query.answer}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Answered on {new Date(query.answeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor={`answer-${query.id}`}>Your Answer</Label>
                        <Textarea
                          id={`answer-${query.id}`}
                          value={answerText[query.id] || ""}
                          onChange={(e) => setAnswerText({ ...answerText, [query.id]: e.target.value })}
                          rows={4}
                          placeholder="Type your answer here..."
                        />
                        <Button
                          onClick={() => handleAnswerQuery(query.id)}
                          disabled={loading}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit Answer
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <p>Please complete your profile to access this feature.</p>
    </div>
  );
}
