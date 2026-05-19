// PatientForm.tsx
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

// Validation Schema ด้วย Zod
const patientSchema = z.object({
  firstName: z.string().min(2, 'กรุณากรอกชื่อจริง'),
  lastName: z.string().min(2, 'กรุณากรอกนามสกุล'),
  symptoms: z.string().min(5, 'กรุณาระบุอาการเบื้องต้นอย่างน้อย 5 ตัวอักษร'),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function PatientForm() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitSuccessful } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { firstName: '', lastName: '', symptoms: '' }
  });

  const watchAllFields = watch();
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // คอยจับตาดูทุกลายละเอียดที่คนไข้พิมพ์แล้วส่งขึ้น Server ทันที
  useEffect(() => {
    if (isSubmitSuccessful) return;

    // ส่งข้อมูลที่กำลังพิมพ์ให้ Staff เห็นแบบ Real-time
    socket.emit('patient_typing', watchAllFields);

    // ทำระบบ Debounce: ถ้าหยุดพิมพ์เกิน 2 วินาที ให้ถือว่า Inactive
    if (idleTimer.current) clearTimeout(idleTimer.current);
    
    idleTimer.current = setTimeout(() => {
      socket.emit('patient_idle');
    }, 2000);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [watchAllFields, isSubmitSuccessful]);

  const onSubmit = (data: PatientFormData) => {
    socket.emit('patient_submit', data);
    alert('ส่งข้อมูลเรียบร้อยแล้วครับ!');
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">ฟอร์มลงทะเบียนผู้ป่วย</h2>
      
      {isSubmitSuccessful ? (
        <div className="p-4 bg-green-100 text-green-700 rounded-md text-center font-semibold">
          ✓ ส่งข้อมูลเข้าสู่ระบบเรียบร้อยแล้ว
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ชื่อจริง</label>
            <input {...register('firstName')} className="mt-1 w-full p-2 border rounded-md" />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
            <input {...register('lastName')} className="mt-1 w-full p-2 border rounded-md" />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">อาการป่วยเบื้องต้น</label>
            <textarea {...register('symptoms')} rows={3} className="mt-1 w-full p-2 border rounded-md" />
            {errors.symptoms && <p className="text-red-500 text-xs mt-1">{errors.symptoms.message}</p>}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition">
            ส่งข้อมูล
          </button>
        </form>
      )}
    </div>
  );
}