import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Course } from "@/types/course";

// GET: Retrieve all courses
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("coursesDb");
    const courses = await db.collection("courses").find({}).toArray();
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("Error retrieving courses:", error);
    return NextResponse.json(
      { error: "Failed to retrieve courses." },
      { status: 500 }
    );
  }
}

// POST: Add a new course
export async function POST(request: Request) {
  try {
    const newCourse: Omit<Course, "id"> = await request.json();
    const client = await clientPromise;
    const db = client.db("coursesDb");

    //Get the next ID
    const lastCourse = await db
    .collection("courses")
    .findOne({}, {sort: { id: -1}});
    const nextId = lastCourse ? lastCourse.id + 1 : 1;

    const courseToInsert = { ...newCourse, id: nextId};
    const result = await db.collection("courses").insertOne(courseToInsert);

    if(!result.acknowledged){
      throw new Error("Failed to insert course");
    }

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error("Error adding course:", error);
    return NextResponse.json(
      { error: "Failed to add course." },
      { status: 500 }
    );
  }
}
