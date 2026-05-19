// StaffView.tsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

interface PatientSession {
  status: 'filling' | 'inactive' | 'submitted';
  data: {
    firstName: string;
    lastName: string;
    symptoms: string;
  };
}

export default function StaffView() {
  const [session, setSession] = useState<PatientSession>({
    status: 'inactive',
    data: { firstName: '', lastName: '', symptoms: '' }
  });

  useEffect(() => {
    // รอรับข้อมูลอัปเดตจาก Server
    socket.on('session_update', (updatedSession: PatientSession) => {
      setSession(updatedSession);
    });

    return () => {
      socket.off('session_update');
    };
  }, []);

  // ฟังก์ชันช่วยเลือกสีของ Indicator
  const getStatusDetails = (status: PatientSession['status']) => {
    switch (status) {
      case 'filling':
        return { color: 'bg-amber-500 animate-pulse', text: 'กำลังพิมพ์ข้อมูล (Actively Filling)' };
      case 'submitted':
        return { color: 'bg-green-500', text: 'ส่งฟอร์มแล้ว (Submitted)' };
      case 'inactive':
      default:
        return { color: 'bg-gray-400', text: 'ไม่ได้พิมพ์/เปิดหน้าต่างทิ้งไว้ (Inactive)' };
    }
  };

  const statusInfo = getStatusDetails(session.status);

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-slate-900 text-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-xl font-bold tracking-wide">Staff Monitoring System</h2>
        
        {/* Indicator แสดงสถานะแบบ Real-time */}
        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span className={`h-3 w-3 rounded-full ${statusInfo.color}`}></span>
          <span className="text-xs font-medium text-slate-300">{statusInfo.text}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 p-4 rounded-md">
            <span className="text-xs text-slate-400 block uppercase">First Name</span>
            <p className="text-lg font-semibold min-h-[1.75rem]">{session.data.firstName || '-'}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-md">
            <span className="text-xs text-slate-400 block uppercase">Last Name</span>
            <p className="text-lg font-semibold min-h-[1.75rem]">{session.data.lastName || '-'}</p>
          </div>
        </div>

        <div className="bg-slate-800 p-4 rounded-md">
          <span className="text-xs text-slate-400 block uppercase">Symptoms</span>
          <p className="text-base mt-1 whitespace-pre-wrap min-h-[3rem] text-slate-200">
            {session.data.symptoms || 'ยังไม่มีการกรอกข้อมูลอาการ...'}
          </p>
        </div>
      </div>

      {session.status === 'submitted' && (
        <div className="mt-6 text-center text-xs text-emerald-400 font-mono">
          Ready for clinical review.
        </div>
      )}
    </div>
  );
}