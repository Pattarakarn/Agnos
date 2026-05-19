'use client'
import { Fields } from '@/app/schemas/patient';
import { use, useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

interface FullPatient {
    id: string;
    status: string;
    currentField: string;
    progress: number;
    data: Record<string, string>;
}

interface PageProps {
    params: Promise<{ id: string }>;
}
export default function LiveView({ params }: PageProps) {
    const { id } = use(params);

    const [patient, setPatient] = useState<FullPatient | null>(null);

    useEffect(() => {
        if (!id) return;
        socket.emit('patient_view', { patientId: id });

        socket.on('patient_full_data_response', (fullData: FullPatient) => {
            setPatient(fullData);
        });

        return () => {
            socket.emit('patient_leave');
            socket.off('patient_full_data_response');
        };
    }, [id]);

    if (!patient) {
        return <div className="p-8 text-center text-slate-400">กำลังเชื่อมต่อ . . .</div>;
    }
    // console.log(patient)
    return (
        <div className="p-8 bg-slate-50">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center border-b pb-4 mb-6 border-slate-400">
                    <div className='flex items-center gap-2'>
                        <div className={`w-3 h-3 rounded-full bg-[#0D9488] animate-pulse ${patient.status == "Active" ? "" : "opacity-50"}`} />

                        <h2 className="text-xl font-bold text-slate-800">
                            Live
                        </h2>
                        <span className={`text-xs font-normal px-2 py-0.5 rounded ${patient.status == "Active" ? "bg-live" : " bg-slate-100"}`}>
                            ID: {patient.id}
                        </span>
                    </div>

                </div>

                {Fields.map((field, i) => (
                    <div key={i} className='my-2'>
                        {field.type == "textarea"
                            ? <div>
                                <label className="block text-sm font-medium text-gray-700 font-semibold">
                                    {field.label}{field.required && <small className='text-red-500'>*</small>}
                                </label>
                                <textarea rows={3}
                                    className={`mt-1 w-full p-2 border rounded-md 
                                     ${patient.currentField == field.name ? "bg-[var(--input-bg)]" : "!bg-slate-50"}`}
                                    value={patient.data[field.name]}
                                    readOnly
                                />
                            </div>
                            : field.options
                                ? <div>
                                    <label className="block text-sm font-medium text-gray-700 font-semibold">
                                        {field.label}
                                        {field.required && <small className='text-red-500'>*</small>}
                                    </label>
                                    <select
                                        className="my-2 w-full p-2 border rounded-md bg-white"
                                    >
                                        <option value="">{patient.data[field.name]}</option>
                                    </select>
                                </div>
                                : <div className=''>
                                    <label className="block text-sm font-medium text-gray-700 font-semibold">
                                        {field.label}{
                                            field.required && <small className='text-red-500'>*</small>
                                        }
                                    </label>
                                    <input className={`mt-1 w-full p-2 border rounded-md 
                                    ${patient.currentField == field.name ? "" : "!bg-slate-50"}`}
                                        value={patient.data[field.name]}
                                        readOnly
                                    />
                                </div>
                        }
                    </div>

                ))}

            </div>
        </div>
    );
}