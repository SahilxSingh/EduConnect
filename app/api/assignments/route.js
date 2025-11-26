import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function normalize(value) {
  return value ? value.trim() : null;
}

async function getInternalUserId(clerkId) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .maybeSingle();
    
  if (error || !data) {
    throw error || new Error("User not found");
  }

  return data.id;
}

export async function POST(request) {
  try {
    const { teacherId, course, major, title, details, dueDate } = await request.json();

    if (!teacherId || !course || !major || !title || !details || !dueDate) {
      return NextResponse.json(
        { error: "Missing required assignment fields" },
        { status: 400 }
      );
    }

    const internalTeacherId = await getInternalUserId(teacherId);
    console.log("internalTeacherId", internalTeacherId);
    const { error } = await supabaseAdmin.from("assignments").insert({
      teacher_id: internalTeacherId,
      course: normalize(course),
      major: normalize(major),
      title,
      details,
      due_date: dueDate,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[assignments][POST] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create assignment" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json(
        { error: "Missing teacherId" },
        { status: 400 }
      );
    }

    const internalTeacherId = await getInternalUserId(teacherId);

    const { data, error } = await supabaseAdmin
      .from("assignments")
      .select("id, title, details, due_date, course, major, created_at")
      .eq("teacher_id", internalTeacherId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const assignments = (data || []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      details: assignment.details,
      dueDate: assignment.due_date,
      course: assignment.course,
      major: assignment.major,
      createdAt: assignment.created_at,
    }));

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("[assignments][GET] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load assignments" },
      { status: 500 }
    );
  }
}

