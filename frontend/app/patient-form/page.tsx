'use client'
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

// Validation Schema ด้วย Zod
const patientSchema = z.object({
  firstName: z.string().min(2, 'กรุณากรอกชื่อจริง'),
  // เผื่ออยากเปิดใช้ middleName ในอนาคต (กำหนดให้เป็น optional คือจะกรอกหรือไม่กรอกก็ได้)
  // middleName: z.string().optional(),
  lastName: z.string().min(2, 'กรุณากรอกนามสกุล'),
  // ใช้ .date() หรือ ตรวจสอบว่าเป็น string ที่ไม่ว่าง
  dateOfBirth: z.string().min(1, 'กรุณาเลือกวัน/เดือน/ปีเกิด'),
  gender: z.string().min(1, 'กรุณาเลือกเพศ'),
  // ตรวจสอบเบอร์โทรเบื้องต้น (เช่น ต้องเป็นตัวเลข 9-10 หลัก)
  phoneNumber: z.string()
    .min(9, 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง')
    .max(10, 'เบอร์โทรศัพท์ไม่ควรเกิน 10 หลัก')
    .regex(/^[0-9]+$/, 'กรุณากรอกเฉพาะตัวเลขเท่านั้น'),
  // ตรวจสอบว่าเป็นรูปแบบ Email ที่ถูกต้องจริงๆ
  email: z.string()
    .min(1, 'กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  address: z.string().min(5, 'กรุณากรอกที่อยู่ให้ชัดเจน'),
  preferredLanguage: z.string().min(1, 'กรุณาเลือกภาษาที่สะดวกในการสื่อสาร'),
  nationality: z.string().min(2, 'กรุณากรอกสัญชาติ'),
  emergencyContact: z.string().min(2, 'กรุณากรอกข้อมูลติดต่อฉุกเฉิน'),
  // ศาสนา บางคนอาจจะไม่สะดวกระบุ เลยปรับให้เป็น optional หรือเลือกไม่ระบุได้ครับ
  religion: z.string().optional(),
  // symptoms: z.string().min(5, 'กรุณาระบุอาการเบื้องต้นอย่างน้อย 5 ตัวอักษร'),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function PatientForm() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitSuccessful, dirtyFields } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    // defaultValues: { firstName: '', lastName: '', }
  });
  const fields = [
    { name: 'firstName', required: true },
    { name: 'lastName', required: true },
    { name: 'dateOfBirth', required: true },
    { name: 'gender', required: true, options: [{ value: 'male', label: 'ชาย' }, { value: 'female', label: 'หญิง', }] },
    { name: 'phoneNumber', required: true },
    { name: 'email', required: true },
    { name: 'address', required: true, type: 'textarea' },
    {
      name: 'preferredLanguage', required: true, options: [
        { value: 'th', label: 'ภาษาไทย (Thai)' },
        { value: 'en', label: 'ภาษาอังกฤษ (English)' },
        { value: 'zh', label: 'ภาษาจีน (Chinese)' },
      ]
    },
    { name: 'nationality', required: true },
    { name: 'emergencyContact', required: true },
  ]

  const watchAllFields = watch();
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const handleInputFocus = (fieldName) => {
    let formId = localStorage.getItem("formId");
    if (!formId) {
      formId = `${Math.floor(10000 + Math.random() * 9000)}`;
      localStorage.setItem("formId", formId);
    }
    console.log(formId)
    socket.emit("patient_focus_field", {
      patientId: formId,
      currentField: fieldName
    });
  };
  useEffect(() => {
    if (isSubmitSuccessful) return;
    console.log(watchAllFields)
    let formId = localStorage.getItem("formId");
    if (!formId) {
      formId = `${Math.floor(10000 + Math.random() * 9000)}`;
      localStorage.setItem("formId", formId);
    }
    // socket.emit('patient_typing', watchAllFields);
    const filledCount = Object.keys(dirtyFields).length;
    const progressPercentage = (filledCount / 9) * 100;
    socket.emit('patient_typing', {
      patientId: formId,
      ...watchAllFields,
      progress: progressPercentage
    });

    // patientId: anonymousId,
    // ทำระบบ Debounce: ถ้าหยุดพิมพ์เกิน 2 วินาที ให้ถือว่า Inactive
    // if (idleTimer.current) clearTimeout(idleTimer.current);

    // idleTimer.current = setTimeout(() => {
    //   socket.emit('patient_idle');
    // }, 2000);

    // return () => {
    //   if (idleTimer.current) clearTimeout(idleTimer.current);
    // };
  }, [watchAllFields, isSubmitSuccessful]);

  const handleUserTyping = (fieldName: string, value: string) => {

    // [A] ทันทีที่ขยับนิ้วพิมพ์ ให้ล้างตัวนับถอยหลังอันเก่าทิ้งก่อน (คนไข้ยังแอกทีฟอยู่)
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

    // [B] ยิง Socket บอก Server ทันทีว่า "กำลังพิมพ์อยู่ช่องนี้อยู่นะ" (สถานะ: filling)
    socket.emit('patient_typing', {
      patientId: patientId,         // 🔑 ส่ง ID ไปด้วยเสมอ
      currentField: fieldName,
      formData: { [fieldName]: value } // อัปเดตข้อมูลทีละฟิลด์แบบสดๆ
    });

    // [C] เริ่มนับถอยหลัง 2 วินาทีใหม่ทันที
    idleTimer.current = setTimeout(() => {
      // 🚨 ถ้าเวลาเดินจนครบ 2 วินาทีโดยไม่มีการพิมพ์เพิ่ม แปลว่าหยุดพิมพ์แล้ว!
      // ส่ง Event 'patient_idle' พร้อมพ่วง patientId ไปให้ Server อัปเดตการ์ด
      socket.emit('patient_idle', { patientId: patientId });
    }, 2000);
  };

  const onSubmit = (data: PatientFormData) => {
    socket.emit('patient_submit', data);
    alert('ส่งข้อมูลเรียบร้อยแล้วครับ!');
  };

  return (
    <section className='py-4 bg-slate-50'>
      <center >
        <p className='text-lg font-bold pt-4'> Patient Form</p>
        Please provide your details below to register your patient account.
      </center>
      <div className="max-w-lg w-full mx-auto my-5 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800"></h2>

        {isSubmitSuccessful ? (
          <div className="p-4 bg-green-100 text-green-700 rounded-md text-center font-semibold">
            ✓ ส่งข้อมูลเข้าสู่ระบบเรียบร้อยแล้ว
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* ชื่อจริง */}
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อจริง</label>
              <input {...register('firstName')} className="mt-1 w-full p-2 border rounded-md"
                onFocus={() => handleInputFocus("firstName")} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>

            {/* ชื่อกลาง */}
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อกลาง</label>
              <input {...register('middleName')} className="mt-1 w-full p-2 border rounded-md" />
              {errors.middleName && <p className="text-red-500 text-xs mt-1">{errors.middleName.message}</p>}
            </div>

            {/* นามสกุล */}
            <div>
              <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
              <input {...register('lastName')} className="mt-1 w-full p-2 border rounded-md" />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>

            {/* วัน/เดือน/ปีเกิด */}
            <div>
              <label className="block text-sm font-medium text-gray-700">วัน/เดือน/ปีเกิด</label>
              <input type="date" {...register('dateOfBirth')} className="mt-1 w-full p-2 border rounded-md" />
              {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            {/* เพศ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">เพศ</label>
              <select {...register('gender')} className="mt-1 w-full p-2 border rounded-md bg-white">
                <option value="">-- เลือกเพศ --</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
                <option value="other">อื่นๆ / ไม่ระบุ</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
              <input type="tel" {...register('phoneNumber')} className="mt-1 w-full p-2 border rounded-md" placeholder="เช่น 0812345678" />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
            </div>

            {/* อีเมล */}
            <div>
              <label className="block text-sm font-medium text-gray-700">อีเมล</label>
              <input type="email" {...register('email')} className="mt-1 w-full p-2 border rounded-md" placeholder="example@email.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* ที่อยู่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ปัจจุบัน</label>
              <textarea {...register('address')} rows={3} className="mt-1 w-full p-2 border rounded-md" placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด..." />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>

            {/* ภาษาที่สะดวกในการสื่อสาร */}
            <div>
              <label className="block text-sm font-medium text-gray-700">ภาษาที่สะดวกในการสื่อสาร</label>
              <select {...register('preferredLanguage')} className="mt-1 w-full p-2 border rounded-md bg-white">
                <option value="">-- เลือกภาษา --</option>
                <option value="th">ภาษาไทย (Thai)</option>
                <option value="en">ภาษาอังกฤษ (English)</option>
                <option value="zh">ภาษาจีน (Chinese)</option>
              </select>
              {errors.preferredLanguage && <p className="text-red-500 text-xs mt-1">{errors.preferredLanguage.message}</p>}
            </div>

            {/* สัญชาติ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">สัญชาติ</label>
              <input {...register('nationality')} className="mt-1 w-full p-2 border rounded-md" placeholder="เช่น ไทย" />
              {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality.message}</p>}
            </div>

            {/* ข้อมูลติดต่อฉุกเฉิน */}
            <div>
              <label className="block text-sm font-medium text-gray-700">ผู้ติดต่อฉุกเฉิน (ชื่อ และ เบอร์โทรศัพท์)</label>
              <input {...register('emergencyContact')} className="mt-1 w-full p-2 border rounded-md" placeholder="เช่น นายสมชาย (พี่ชาย) 089-xxx-xxxx" />
              {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.message}</p>}
            </div>

            {/* ศาสนา */}
            <div>
              <label className="block text-sm font-medium text-gray-700">ศาสนา (ไม่บังคับ)</label>
              <input {...register('religion')} className="mt-1 w-full p-2 border rounded-md" placeholder="เช่น พุทธ / คริสต์ / อิสลาม (ถ้ามี)" />
              {errors.religion && <p className="text-red-500 text-xs mt-1">{errors.religion.message}</p>}
            </div>

            <button type="submit" className="primary"
              id="">
              ส่งข้อมูล
            </button>
          </form>
        )}
      </div>
    </section>
  );
}