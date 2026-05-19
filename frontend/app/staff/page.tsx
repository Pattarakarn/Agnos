'use client'
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Fields, PatientFormData } from '../schemas/patient';

const socket = io('http://localhost:4000');

interface Data {
    id: string
    currentField: string
    status: 'Active' | 'Inactive'
    progress: number
    updatedAt: Date
    data: Record<keyof PatientFormData, string>
}
export default function StaffView() {

    const [patients, setPatients] = useState({});
    const router = useRouter()
    useEffect(() => {
        socket.emit('dashboard_init');

        socket.on('all_sessions_update', (allSessions) => {
            setPatients(allSessions);
        });

        socket.on('single_session_update', (updatedPatient) => {
            setPatients((prevPatients) => ({
                ...prevPatients,
                [updatedPatient.id]: updatedPatient
            }));
        });

        return () => {
            socket.off('all_sessions_update');
            socket.off('single_session_update');
        };
    }, []);

    const patientList = Object.values(patients) as Data[];

    return (
        <section className='p-5 bg-slate-50 min-h-screen'>
            <div className='flex justify-between my-5'>
                <div>
                    <h2 className="text-xl font-bold tracking-wide">Monitoring Dashboard</h2>
                    Real-time status of current patient intake forms
                </div>

                {/* filter */}
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {patientList.map((patient) => (
                    <div
                        key={patient.id}
                        className='rounded-lg border border-slate-200 shadow hover:shadow-md p-4 px-5 grid gap-y-1 bg-white group/card'
                    >

                        <p>#{patient.id}</p>
                        <div className='flex justify-between items-center text-sm text-slate-400'>
                            <div className={` flex gap-1 items-center px-2 rounded-full delay-300 transition-all duration-300 ${patient.status == "Active" ? "bg-live text-[#115E59]" : "bg-[#0D9488]/[0.1] text-[initial]"}`}
                            >
                                <div className={`w-3 h-3 rounded-full ${patient.status == "Active" ? "bg-[#0D9488]" : "bg-[#C4C6CF]"}`} />  {patient.status}
                            </div>

                            {patient.updatedAt
                                ? formatDistanceToNow(new Date(patient.updatedAt), { addSuffix: true })
                                : ''}
                        </div>

                        <div className="grid gap-2 my-3">
                            <span className="text-sm  block ">Focus Field</span>
                            <p className=" bg-zinc-100 p-3 text-[0.9em]">
                                {Fields.find(field => field.name == patient.currentField)?.label || <br />}
                            </p>
                        </div>

                        <button
                            className="w-full my-3 py-2 px-4 rounded-full font-semibold border  relative overflow-hidden  duration-300 ease-in-out  text-primary group-hover/card:border-primary border-[#EBF5FF]  hover:shadow-md hover:text-white cursor-pointer group  transition-[background] duration-300 ease-in-out bg-[linear-gradient(to_right,#EBF5FF_var(--bg-p),transparent_var(--bg-p))]
                            hover:!bg-[linear-gradient(to_right,#0D47A1_var(--bg-p),#EBF5FF_var(--bg-p))]"
                            style={{
                                '--bg-p': `${patient.progress}%`
                            } as React.CSSProperties}
                            
                            onClick={() => router.push(`/staff/view/${patient.id}`)} // คลิกการ์ดใบนี้เพื่อดู Live View
                        >
                            <span className="relative z-10 flex justify-center items-center w-full">
                                View
                            </span>

                            <span className="absolute inset-0 bg-[#0F52BA] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></span>
                        </button>
                    </div>
                ))}
            </div>

        </section>
    );
}