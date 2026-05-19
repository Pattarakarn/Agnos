'use client'
import { formatDistanceToNow } from 'date-fns';
import { use, useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

interface FullPatient {
    id: string;
    status: string;
    currentField: string;
    progress: number;
    data: Record<string, string>; // ดึงข้อมูลดิบมาส่องได้ครบถ้วน
}

interface PageProps {
    // ใน Next.js ยุคนี้ params จะเป็น Promise ต้องระบุ Type แบบนี้ครับ
    params: Promise<{ id: string }>;
}
export default function LiveView({ params }: PageProps) {
    // 🔑 await แกะรหัส id ออกมาจาก Path ตรงนี้ตามกฎของ Next.js 
    const { id } = use(params);
    //   const { id } = useParams<{ id: string }>(); // แกะไอดีคนไข้จาก URL Path
    //   const navigate = useNavigate();
    const fields = [
        { name: 'firstName', label: 'ชื่อจริง', required: true },
        { name: 'middleName', label: 'ชื่อกลาง', required: false },
        { name: 'lastName', label: 'นามสกุล', required: true },
        { name: 'dateOfBirth', label: 'วัน/เดือน/ปีเกิด', required: true },
        { name: 'gender', label: 'เพศ', required: true, options: [{ value: 'male', label: 'ชาย' }, { value: 'female', label: 'หญิง', }] },
        { name: 'phoneNumber', label: 'เบอร์โทรศัพท์', required: true },
        { name: 'email', label: 'อีเมล์', required: true },
        { name: 'address', label: 'ที่อยู่', required: true, type: 'textarea' },
        {
            name: 'preferredLanguage',
            label: 'ภาษา', required: true, options: [
                { value: 'th', label: 'ภาษาไทย (Thai)' },
                { value: 'en', label: 'ภาษาอังกฤษ (English)' },
                { value: 'zh', label: 'ภาษาจีน (Chinese)' },
            ]
        },
        { name: 'nationality', label: 'สัญชาติ', required: true },
        // { name: 'emergencyContact', label: 'ผู้ติดต่อฉุกเฉิน',required: true },
        { name: 'religion', label: 'ศาสนา', required: false },
    ]
    const [patient, setPatient] = useState<FullPatient | null>(null);

    useEffect(() => {
        if (!id) return;
        // if (id) {
        // 🔑 1. บอกเบื้องหลังว่าหน้าจอฉันขอติดตามส่องกล้องคนไข้ ID นี้คนเดียวนะ
        socket.emit('patient_view', { patientId: id });
        // }

        // 2. ตั้งรับฟังข้อมูลเม็ดเต็มที่ส่งมาจากห้องจำเพาะ
        socket.on('patient_full_data_response', (fullData: FullPatient) => {
            console.log('fullData', fullData);
            setPatient(fullData);
        });

        return () => {
            // 🛑 3. สั่งยกเลิกการติดตาม (Leave Room) ทันทีที่เจ้าหน้าที่ปิดหรือกดออกจากหน้านี้
            socket.emit('patient_leave');
            socket.off('patient_full_data_response');
        };
    }, [id]);

    if (!patient) {
        return <div className="p-8 text-center text-slate-400">กำลังเชื่อมต่อข้อมูลสดกับคนไข้...</div>;
    }

    return (
        <div className="p-8 ">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <div className='flex items-center gap-1'>
                        <div className='w-3 h-3 rounded-full bg-[#0D9488] animate-pulse' />
                        {/* <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-primary hover:underline mb-1 block">
              ← กลับหน้าบอร์ดหลัก
            </button> */}
                        <h2 className="text-xl font-bold text-slate-800">
                            Live <span className="text-xs bg-slate-100 font-normal px-2 py-0.5 rounded ml-2">ID: {patient.id}</span>
                        </h2>
                    </div>
                    {/* <div className="text-right">
                        <span className="text-lg font-bold text-primary">{patient.progress}%</span>
                    </div> */}
                    <span className='text-sm text-slate-400'>
                    {patient.updatedAt &&
                        formatDistanceToNow(new Date(patient.updatedAt), { addSuffix: true })
                    }
                    </span>
                </div>

                {/* <div className="mb-6 bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">กำลังจิ้มอยู่ที่ช่อง:</span>
          <span className="text-sm font-bold text-primary animate-pulse">
            📌 {patient.currentField || 'ยังไม่ได้เริ่มกรอก'}
          </span>
        </div> */}


                {fields.map((field, i) => (
                    <div key={i} className='my-2'>
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}{
                                field.required && <small className='text-red-500'>*</small>
                            }
                        </label>
                        <input value="" className="mt-1 w-full p-2 border rounded-md"
                        readOnly/>
                    </div>

                ))}

                {/* <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 block font-semibold mb-1">ชื่อจริง</label>
                            <div className="bg-slate-50 p-3 rounded-lg text-sm font-medium text-slate-700 min-h-[2.75rem]">
                                {patient.data?.firstName || <span className="text-slate-300 italic">ยังไม่ได้กรอก</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block font-semibold mb-1">นามสกุล</label>
                            <div className="bg-slate-50 p-3 rounded-lg text-sm font-medium text-slate-700 min-h-[2.75rem]">
                                {patient.data?.lastName || <span className="text-slate-300 italic">ยังไม่ได้กรอก</span>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 block font-semibold mb-1">อาการสำคัญหลัก (Symptoms)</label>
                        <div className="bg-slate-50 p-3 rounded-lg text-sm font-medium text-slate-700 min-h-[4rem] whitespace-pre-line">
                            {patient.data?.symptoms || <span className="text-slate-300 italic">ยังไม่ได้กรอกข้อมูลอาการ</span>}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-red-400 block font-semibold mb-1">ประวัติแพ้ยา / โรคประจำตัวเสี่ยง</label>
                        <div className="bg-red-50/30 border border-red-100 p-3 rounded-lg text-sm font-semibold text-red-600 min-h-[2.75rem]">
                            {patient.data?.allergies || <span className="text-slate-300 font-normal italic">ไม่มี หรือยังไม่ได้ระบุ</span>}
                        </div>
                    </div>
                </div> */}

            </div>
        </div>
    );
}