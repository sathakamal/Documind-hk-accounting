import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/employees/[id]/status - Update employee status
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !["ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Must be ACTIVE or INACTIVE" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    // Update employee status
    const employee = await prisma.employee.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: employee,
      message: `Employee status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating employee status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update employee status" },
      { status: 500 }
    );
  }
}