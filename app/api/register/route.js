import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function normalize(value) {
  return value ? value.trim() : null;
}

export async function POST(request) {
  try {
    const {
      userId: clerkId,
      email,
      name,
      role,
      course,
      major,
    } = await request.json();

    if (!clerkId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required registration fields" },
        { status: 400 }
      );
    }

    const displayName = name?.trim() || email.split("@")[0];

    // Insert into users table (merged users + profiles)
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: clerkId, // Clerk ID is the primary key
          email,
          role,
          username: displayName,
          name: displayName,
        },
        { onConflict: "id" }
      )
      .select("id")
      .single();

    if (userError || !userRecord) {
      throw userError || new Error("Failed to upsert user");
    }

    if (role === "Student") {
      const { error: studentError } = await supabaseAdmin
        .from("students")
        .upsert(
          {
            user_id: userRecord.id,
            course: normalize(course),
            major: normalize(major),
          },
          { onConflict: "user_id" }
        );

      if (studentError) {
        throw studentError;
      }
    } else if (role === "Teacher") {
      const { error: teacherError } = await supabaseAdmin
        .from("teachers")
        .upsert(
          {
            user_id: userRecord.id,
            subjects: [],
          },
          { onConflict: "user_id" }
        );

      if (teacherError) {
        throw teacherError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[register] error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
