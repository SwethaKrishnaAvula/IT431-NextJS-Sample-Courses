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

// GET: Retrieve a single course by ID
export async function GET_SINGLE(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db("coursesDb");
    const courseId = parseInt(params.id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    }

    const course: Course | null = await db.collection<Course>("courses").findOne({ id: courseId });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error("Error retrieving course:", error);
    return NextResponse.json({ error: "Failed to retrieve course." }, { status: 500 });
  }
}

// POST: Add a new course
export async function POST(request: Request) {
  try {
    const newCourse: Omit<Course, "id"> = await request.json();
    const client = await clientPromise;
    const db = client.db("coursesDb");

    // Get the last course to calculate the next ID
    const lastCourse = await db
      .collection("courses")
      .findOne({}, { sort: { id: -1 } });
    const nextId = lastCourse ? lastCourse.id + 1 : 1;

    const courseToInsert = { ...newCourse, id: nextId };
    const result = await db.collection("courses").insertOne(courseToInsert);

    if (!result.acknowledged) {
      throw new Error("Failed to insert course");
    }

    return NextResponse.json(courseToInsert, { status: 201 });
  } catch (error) {
    console.error("Error adding course:", error);
    return NextResponse.json(
      { error: "Failed to add course." },
      { status: 500 }
    );
  }
}

// PUT: Update a course by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db("coursesDb");
    const courseId = parseInt(params.id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    }

    const updatedCourse: Partial<Course> = await request.json();

    const result = await db.collection<Course>("courses").findOneAndUpdate(
      { id: courseId },
      { $set: updatedCourse },
      { returnDocument: "after" } // Returns the updated document
    );

    if (!result) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Course updated successfully", course: result }, { status: 200 });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Failed to update course." }, { status: 500 });
  }
}

// DELETE: Remove a course by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise;
    const db = client.db("coursesDb");
    const courseId = parseInt(params.id, 10);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    }

    const deletedCourse: Course | null = await db.collection<Course>("courses").findOneAndDelete({ id: courseId });

    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json({ message: `Course with ID ${courseId} deleted.`, course: deletedCourse }, { status: 200 });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Failed to delete course." }, { status: 500 });
  }
}
