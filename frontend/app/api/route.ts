import { NextResponse } from 'next/server';

// ฟังก์ชันนี้คือ Backend แท้ๆ เลยครับ คอยรับข้อมูลจากหน้าบ้านมาประมวลผล
export async function POST(request: Request) {
  const body = await request.json();
  
  // ตรงนี้สามารถเขียนโค้ดต่อกับ Database (เช่น Prisma, Mongo, MySQL) ได้เลย
  console.log("เซฟข้อมูลคนไข้ลง DB:", body);

  return NextResponse.json({ success: true, message: "บันทึกสำเร็จ" });
}