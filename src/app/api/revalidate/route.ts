import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Revalidate the home page
    revalidatePath("/");

    return NextResponse.json(
      { message: "Revalidation triggered successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 },
    );
  }
}
