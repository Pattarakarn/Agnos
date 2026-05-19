'use client'
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

interface PatientSession {
    status: 'Active' | 'Inactive' | 'Submitted';
    data: {
        firstName: string;
        lastName: string;
        symptoms: string;
    };
}

export default function StaffView() {
    const [session, setSession] = useState<PatientSession>({
        status: 'Inactive',
        data: { firstName: '', lastName: '', symptoms: '' }
    });

    const [patients, setPatients] = useState({});
    const router = useRouter()
    useEffect(() => {
        // รอรับข้อมูลอัปเดตจาก Server
        // socket.on('session_update', (updatedSession: PatientSession) => {
        //     setSession(updatedSession);
        // });

        // return () => {
        //     socket.off('session_update');
        // };
        socket.emit('dashboard_init');

        // [B] รอรับข้อมูลการ์ดทั้งหมดครั้งแรกจากเซิร์ฟเวอร์
        socket.on('all_sessions_update', (allSessions) => {
            // socket.on('all_sessions_update', (data: Record<string, PatientOverview>) => {
            setPatients(allSessions);
        });

        // [C] สำคัญมาก! รอรับข้อมูลอัปเดตแบบเรียลไทม์ "ทีละใบ" เมื่อคนไข้ฝั่งโน้นคีย์ข้อมูล
        socket.on('single_session_update', (updatedPatient) => {
            setPatients((prevPatients) => ({
                ...prevPatients,
                [updatedPatient.id]: updatedPatient // ถ้ามี ID เดิมอยู่แล้วจะอัปเดตทับ ถ้าไม่มีจะเพิ่มการ์ดใหม่เข้าบอร์ดทันที
            }));
        });

    //     // ทริค Re-render ข้อความเวลาทุก ๆ 30 วินาที
    // const timer = setInterval(() => setPatients((prev) => ({ ...prev })), 30000);

        // คืนค่าเพื่อปิดสัญญานเมื่อปิดหน้านี้
        return () => {
            socket.off('all_sessions_update');
            socket.off('single_session_update');
            // clearInterval(timer);
        };
    }, []);

    const patientList = Object.values(patients);
    console.log(patientList)
    return (
        <section className='p-5'>
            <div className='flex justify-between my-5'>
                <div>
                    <h2 className="text-xl font-bold tracking-wide">Monitoring Dashboard</h2>
                    Real-time status of current patient intake forms
                </div>

                All
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {patientList.map((patient) => (
                    <div
                        key={patient.id}
                        className='rounded-lg border border-slate-200 shadow hover:shadow-md p-4 px-5 grid gap-y-1 bg-white'
                    >

                        <p>#{patient.id}</p>
                        <div className='flex justify-between items-center text-sm text-slate-400'>
                            {/* <div className='text-sm flex gap-1 items-center bg-[#79F7EA] px-2 text-[#0D9488] rounded-full' */}
                            <div className=' flex gap-1 items-center bg-[#CCFBF1] text-[#115E59] px-2 rounded-full'
                            >
                                <div className='w-3 h-3 rounded-full bg-[#0D9488] ' />  {patient.status}
                            </div>

                            {patient.updatedAt
                                ? formatDistanceToNow(new Date(patient.updatedAt), { addSuffix: true })
                                : ''}
                        </div>
                        {/* intake started */}

                        {/* <div className="bg-zinc-100 p-3 rounded-md">
                            <span className="text-xs uppercase block">First Name</span>
                            <p className="text-lg font-semibold min-h-[1.75rem]">{session.data.firstName || '-'}</p>
                        </div>*/}
                        <div className="grid gap-2 my-3">
                            <span className="text-xs  block uppercase">Current Field</span>
                            <p className=" bg-zinc-100 p-3 ">{patient.currentField || '-'}</p>
                        </div>


                        {/* <button className='my-3'>
                            View
                        </button> */}
                        {/* 0D47A1 */}
                        {/* text-[#0F52BA] */}
                        <button
                            className="w-full my-3 py-2 px-4 rounded-full font-semibold border  relative overflow-hidden transition-all duration-300 ease-in-out  text-primary hover:border-primary border-border  hover:shadow-md hover:text-white cursor-pointer group  transition-all duration-300 ease-in-out bg-[linear-gradient(to_right,#EBF5FF_var(--bg-p),transparent_var(--bg-p))]
    hover:!bg-[linear-gradient(to_right,#0D47A1_var(--bg-p),#EBF5FF_var(--bg-p))]"
                            style={{
                                '--bg-p': `${patient.progress}%`
                            } as React.CSSProperties}
                            // style={{
                            //     background: `linear-gradient(to right, #EBF5FF ${patient.progress}%, transparent ${patient.progress}%)`
                            // }}
                            onClick={() => router.push(`/staff/view/${patient.id}`)} // คลิกการ์ดใบนี้เพื่อดู Live View
                        >
                            {/* คอนเทนต์ด้านในปุ่ม */}
                            <span className="relative z-10 flex justify-center items-center w-full">
                                View

                                {/* ตัวเลข % ด้านขวา: ตอนแรกกรอบสีฟ้า พอ Hover (ใช้ group-hover) จะเปลี่ยนเป็นกรอบใส/ขาว */}
                                {/* <span className="bg-white/90 px-1.5 py-0.5 rounded-sm border border-blue-200/60 transition-all duration-300 text-[#0F52BA] group-hover:bg-white/20 group-hover:border-white/30 group-hover:text-white">
                                    {patient.progress}%
                                </span> */}
                            </span>

                            {/* เลเยอร์สีน้ำเงินที่จะวิ่งขึ้นมาถมเต็มปุ่มตอน Hover (ซ่อนไว้ด้านล่างด้วย opacity) */}
                            <span className="absolute inset-0 bg-[#0F52BA] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                        </button>
                    </div>
                ))}
            </div>

        </section>
    );
}