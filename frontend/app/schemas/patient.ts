import { z } from "zod";

export const patientSchema = z.object({
    firstName: z.string().min(2, 'กรุณากรอกชื่อจริง'),
    middleName: z.string().optional(),
    lastName: z.string().min(2, 'กรุณากรอกนามสกุล'),
    dateOfBirth: z.string().min(1, 'กรุณาเลือกวัน/เดือน/ปีเกิด'),
    gender: z.string().min(1, 'กรุณาเลือกเพศ'),
    phoneNumber: z.string()
        .min(9, 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง')
        .max(10, 'เบอร์โทรศัพท์ไม่ควรเกิน 10 หลัก')
        .regex(/^[0-9]+$/, 'กรุณากรอกเฉพาะตัวเลขเท่านั้น'),
    email: z.string()
        .min(1, 'กรุณากรอกอีเมล์')
        .email('รูปแบบอีเมล์ไม่ถูกต้อง'),
    address: z.string().min(5, 'กรุณากรอกที่อยู่ให้ชัดเจน'),
    preferredLanguage: z.string().min(1, 'กรุณาเลือกภาษาที่สะดวกในการสื่อสาร'),
    nationality: z.string().min(2, 'กรุณากรอกสัญชาติ'),
    // emergencyContact: z.string().min(2, 'กรุณากรอกข้อมูลติดต่อฉุกเฉิน'),
    religion: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

export interface IFormField {
    name: keyof PatientFormData; 
    label: string;
    type?: "text" | "select" | "tel" | "email" | "textarea" | "date";
    placeholder?: string;
    required?: boolean;
    options?: { value: string, label: string }[];
}

export const Fields: IFormField[] = [
    {
        name: 'firstName',
        label: 'ชื่อจริง',
        required: true
    },
    {
        name: 'middleName',
        label: 'ชื่อกลาง',
        required: false
    },
    {
        name: 'lastName',
        label: 'นามสกุล',
        required: true
    },
    {
        name: 'dateOfBirth',
        label: 'วัน/เดือน/ปีเกิด',
        required: true,
        type: 'date'
    },
    {
        name: 'gender',
        label: 'เพศ',
        required: true,
        options: [
            { value: 'male', label: 'ชาย' },
            { value: 'female', label: 'หญิง', }
        ]
    },
    {
        name: 'phoneNumber',
        label: 'เบอร์โทรศัพท์',
        required: true,
        placeholder: "เช่น 0812345678"
    },
    {
        name: 'email',
        label: 'อีเมล์',
        required: true,
        placeholder: "example@email.com"

    },
    {
        name: 'address',
        label: 'ที่อยู่',
        required: true,
        type: 'textarea',
        placeholder: "บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด..."
    },
    {
        name: 'preferredLanguage',
        label: 'ภาษา',
        required: true,
        options: [
            { value: 'th', label: 'ภาษาไทย (Thai)' },
            { value: 'en', label: 'ภาษาอังกฤษ (English)' },
            { value: 'zh', label: 'ภาษาจีน (Chinese)' },
        ]
    },
    {
        name: 'nationality',
        label: 'สัญชาติ',
        required: true,
        placeholder: 'เช่น ไทย'
    },
    // { name: 'emergencyContact', label: 'ผู้ติดต่อฉุกเฉิน',required: true },
    // placeholder="เช่น นายสมชาย (พี่ชาย) 089-xxx-xxxx"
    {
        name: 'religion',
        label: 'ศาสนา',
        required: false,
        placeholder: "เช่น พุทธ / คริสต์ / อิสลาม (ถ้ามี)"
    },
]