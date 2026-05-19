// server.js (ปรับปรุงใหม่)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 🆕 เปลี่ยนมาเก็บเป็น Object ของหลายๆ แฟ้มคนไข้ (Key คือ patientId)
let patientSessions = {};

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // 1. เจ้าหน้าที่เปิดหน้า Dashboard มาครั้งแรก ดึงรายชื่อคนไข้ทั้งหมดที่กำลังเปิดฟอร์มอยู่ไปโชว์เป็น "หลายการ์ด"
  socket.on('dashboard_init', () => {
    const overviewSessions = {};
    Object.keys(patientSessions).forEach(id => {
      const { data, ...overview } = patientSessions[id];
      overviewSessions[id] = overview;
    });
    // socket.emit('all_sessions_update', patientSessions);
    socket.emit('all_sessions_update', overviewSessions);
  });

  socket.on('patient_view', ({ patientId }) => {
    // ออกจากห้องเดิมก่อนหน้า (ถ้ามี)
    if (socket.currentViewingPatientId) {
      socket.leave(`room_patient_${socket.currentViewingPatientId}`);
    }

    // เอา Socket เครื่องนี้เข้าห้องจำเพาะของคนไข้คนนี้
    socket.join(`room_patient_${patientId}`);
    socket.currentViewingPatientId = patientId;

    // ส่งข้อมูลแบบละเอียดครบทุกฟิลด์กลับไปให้เครื่องที่เพิ่งเข้ามาดูทันที
    if (patientSessions[patientId]) {
      socket.emit('patient_full_data_response', patientSessions[patientId]);
    }
  });

  socket.on('patient_leave', () => {
    if (socket.currentViewingPatientId) {
      socket.leave(`room_patient_${socket.currentViewingPatientId}`);
      socket.currentViewingPatientId = null;
    }
  });

  // 2. รับรู้เมื่อคนไข้คนใดคนหนึ่งส่งสถานะพิมพ์เข้ามา
  socket.on('patient_typing', ({ patientId, currentField, progress, formData }) => {
    // อัปเดตข้อมูลแยกรายบุคคลตาม patientId
    patientSessions[patientId] = {
      id: patientId,
      status: 'Active',
      currentField: currentField, // 🆕 เก็บว่าตอนนี้คีย์ช่องไหนอยู่
      progress: progress,         // 🆕 เก็บ % ความคืบหน้า
      data: formData,             // ข้อมูลในฟอร์ม (จะเอาไปใช้ในฟังก์ชันเจาะลึกคลิกดูเรียลไทม์)
      updatedAt: Date.now()
    };

    const { data, ...overview } = patientSessions[patientId];
    io.emit('single_session_update', overview);

    // 📡 สตรีมที่ 2: ยิงข้อมูลตัวเต็ม "เข้าห้องเฉพาะ" ของคนไข้คนนี้เท่านั้น
    io.to(`room_patient_${patientId}`).emit('patient_full_data_response', patientSessions[patientId]);
    // ส่งข้อมูลอัปเดตของการ์ดใบนี้ใบเดียวไปที่ Dashboard (ใช้ io.emit เพื่อให้บอร์ดอัปเดตสด)
    io.emit('single_session_update', patientSessions[patientId]);
  });

  socket.on('patient_focus_field', ({ patientId, currentField }) => {
    
    // 🛠️ เช็คก่อนว่ามีข้อมูลคนไข้คนนี้ในระบบชั่วคราวหรือยัง (กันพัง)
    if (!patientSessions[patientId]) {
      patientSessions[patientId] = {
        id: patientId,
        status: 'Active',
        progress: 0,
        data: {},
        updatedAt: Date.now()
      };
    }

    // 🔄 อัปเดตเฉพาะชื่อฟิลด์ปัจจุบันที่เขากำลังจิ้มอยู่
    patientSessions[patientId].currentField = currentField;
    patientSessions[patientId].status = 'Active'; // เปลี่ยนสถานะให้เป็นกำลังกรอกเผื่อกรณีที่เคย Idle ไป
    patientSessions[patientId].updatedAt = Date.now();

    // 📡 ยิงกระจายข้อมูลอัปเดตชิ้นนี้ออกไปบอกหน้า Dashboard ทุกจอ
    io.emit('single_session_update', patientSessions[patientId]);
  });

  // 3. เมื่อคนไข้หยุดพิมพ์ (Idle)
  socket.on('patient_idle', ({ patientId }) => {
    if (patientSessions[patientId] && patientSessions[patientId].status !== 'Submitted') {
      patientSessions[patientId].status = 'Inactive';
      patientSessions[patientId].updatedAt = Date.now();

      const { data, ...overview } = patientSessions[patientId];
      io.emit('single_session_update', overview);
      io.to(`room_patient_${patientId}`).emit('patient_full_data_response', patientSessions[patientId]);
      // io.emit('single_session_update', patientSessions[patientId]);
    }
  });

  // 4. เมื่อคนไข้กด Submit
  socket.on('patient_submit', ({ patientId, finalData }) => {
    if (patientSessions[patientId]) {
      patientSessions[patientId].status = 'Submitted';
      patientSessions[patientId].progress = 100;
      patientSessions[patientId].data = finalData;

      io.emit('single_session_update', patientSessions[patientId]);

      // อนาคต: เอา patientSessions[patientId].data ไปบันทึกลง Database จริงตรงนี้
      // พอเซฟเสร็จอาจจะลบออกจาก Memory ชั่วคราว: delete patientSessions[patientId];
    }
  });

  // 5. เมื่อคนไข้ปิดเบราว์เซอร์ไปเลย (เน็ตหลุด/ปิดแท็บ)
  socket.on('disconnect', () => {
    // อนาคต: แนะนำให้ตั้งเวลาเช็คสัก 5 นาที ถ้าไม่กลับมาค่อยลบการ์ดออก เพื่อป้องกันกรณีเน็ตกระตุกชั่วคราว
    console.log('User disconnected');
  });
});

server.listen(4000, () => console.log('WebSocket Server running on port 4000'));