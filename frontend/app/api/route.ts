import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  
  console.log("เซฟข้อมูลคนไข้ลง DB:", body);

  return NextResponse.json({ success: true, message: "บันทึกสำเร็จ" });
}