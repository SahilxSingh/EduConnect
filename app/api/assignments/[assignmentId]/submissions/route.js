import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function fetchUserSummaries(userIds = []) {
  const unique = Array.from(new Set((userIds || []).filter(Boolean)));
  if (!unique.length) return new Map();

  const { data: users, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, clerk_id, email")
    .in("id", unique);

  if (userError) throw userError;

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("user_id, name, username")
    .in("user_id", unique);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
  const summaryMap = new Map();

  (users || []).forEach((user) => {
    const profile = profileMap.get(user.id);
    summaryMap.set(user.id, {
      userId: user.clerk_id,
      email: user.email,
      name:
        profile?.name ||
        profile?.username ||
        user.email?.split("@")[0] ||
        "User",
      username: profile?.username,
    });
  });

  return summaryMap;
}

export async function GET(_request, { params }) {
  try {
    const { assignmentId } = params;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("assignment_submissions")
      .select("id, submission_details, submitted_at, student_id")
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    const summaries = await fetchUserSummaries(
      (data || []).map((s) => s.student_id)
    );

    const submissions = (data || []).map((submission) => ({
      id: submission.id,
      submissionDetails: submission.submission_details,
      submittedAt: submission.submitted_at,
      studentId: summaries.get(submission.student_id)?.userId,
      student: summaries.get(submission.student_id),
    }));

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("[assignment submissions][GET] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load submissions" },
      { status: 500 }
    );
  }
}


