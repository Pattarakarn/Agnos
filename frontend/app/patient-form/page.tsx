'use client'
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { io } from 'socket.io-client';
import { Fields, PatientFormData, patientSchema } from '../schemas/patient';

const socket = io('http://localhost:4000');

export default function PatientForm() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitSuccessful, dirtyFields },
    getValues,
    setValue
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    // defaultValues: { firstName: '', lastName: '', }
  });

  const allValues = getValues();
  const watchAllFields = watch();
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const handleInputFocus = (fieldName: keyof PatientFormData) => {
    let formId = localStorage.getItem("formId");
    if (!formId) {
      formId = `${Math.floor(10000 + Math.random() * 9000)}`;
      localStorage.setItem("formId", formId);
    }
    socket.emit("patient_focus_field", {
      patientId: formId,
      currentField: fieldName
    });
  };
  // useEffect(() => {
  //   if (isSubmitSuccessful) return;

  //   const filledCount = Object.keys(dirtyFields).length;
  //   const progressPercentage = (filledCount / 9) * 100;
  //   socket.emit('patient_typing', {
  //     patientId: formId,
  //     formData: watchAllFields,
  //     progress: +progressPercentage.toLocaleString([], { maximumFractionDigits: 2 })
  //   });

  //   // ทำระบบ Debounce: ถ้าหยุดพิมพ์เกิน 2 วินาที ให้ถือว่า Inactive
  //   if (idleTimer.current) clearTimeout(idleTimer.current);

  //   idleTimer.current = setTimeout(() => {
  //     socket.emit('patient_idle', {
  //       patientId: formId,
  //     });
  //   }, 2000);

  //   return () => {
  //     if (idleTimer.current) clearTimeout(idleTimer.current);
  //   };
  // }, [watchAllFields, isSubmitSuccessful]);
  console.log(isSubmitSuccessful)
  useEffect(() => {
    let formId = localStorage.getItem("formId");
    if (!formId) {
      formId = `${Math.floor(10000 + Math.random() * 9000)}`;
      localStorage.setItem("formId", formId);
    }
    socket.emit('patient_idle', { patientId: formId });
  }, [])
  const handleUserTyping = (fieldName: keyof PatientFormData, value: string) => {
    setValue(fieldName, value)
    let formId = localStorage.getItem("formId");
    if (!formId) {
      formId = `${Math.floor(10000 + Math.random() * 9000)}`;
      localStorage.setItem("formId", formId);
    }
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }

    socket.emit('patient_typing', {
      patientId: formId,
      currentField: fieldName,
      formData: { ...allValues, [fieldName]: value }
      //formData: { [fieldName]: value } // อัปเดตข้อมูลทีละฟิลด์แ
    });

    idleTimer.current = setTimeout(() => {
      socket.emit('patient_idle', { patientId: formId });
    }, 2000);
  };

  const onSubmit = (data: PatientFormData) => {
    socket.emit('patient_submit', data);
    alert('ส่งข้อมูลเรียบร้อยแล้วครับ!');
  };

  return (
    <section className='py-4 bg-slate-50'>
      <center >
        <p className='text-xl font-bold pt-4 title'> Patient Form</p>
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

            {Fields.map((field, i) => (
              <div key={i} className='my-2'>
                {field.type == "textarea"
                  ?
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-semibold">
                      {field.label}{field.required && <small className='text-red-500'>*</small>}
                    </label>
                    <textarea {...register(field.name)} rows={3}
                      className="mt-1 w-full p-2 border rounded-md"
                      placeholder={field.placeholder}
                      onFocus={() => handleInputFocus(field.name)}
                      onChange={(e) => handleUserTyping(field.name, e.target.value)}
                    />
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name]?.message}</p>}
                  </div>
                  :
                  field.options
                    ?
                    <div>
                      <label className="block text-sm font-medium text-gray-700 font-semibold">
                        {field.label}
                        {field.required && <small className='text-red-500'>*</small>}
                      </label>
                      <select {...register(field.name)}
                        className="my-2 w-full p-2 border rounded-md bg-white"
                        onFocus={() => handleInputFocus(field.name)}
                        onChange={(e) => handleUserTyping(field.name, e.target.value)}
                      >
                        <option value="">-- เลือก{field.label} --</option>
                        {field.options.map((option, ind) => (
                          <option value={option.value} key={ind}>{option.label}</option>
                        ))}
                      </select>
                      {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name]?.message}</p>}
                    </div>
                    :
                    <div className=''>
                      <label className="block text-sm font-medium text-gray-700 font-semibold">
                        {field.label}{
                          field.required && <small className='text-red-500'>*</small>
                        }
                      </label>
                      <input {...register(field.name)} className="mt-1 w-full p-2 border rounded-md"
                        onFocus={() => handleInputFocus(field.name)}
                        placeholder={field.placeholder}
                        onChange={(e) => handleUserTyping(field.name, e.target.value)}
                      />
                      {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name]?.message}</p>}
                    </div>
                }
              </div>
            ))}

            <button type="submit" className="primary mt-3"
              id="">
              ส่งข้อมูล
            </button>
          </form>
        )}
      </div>
    </section>
  );
}