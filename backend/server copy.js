// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // ในโปรดักชั่นจริงให้ระบุ URL ของ Frontend
});

// เก็บข้อมูลฟอร์มและสถานะชั่วคราวใน Memory (ถ้าใช้จริงควรลง Database)
let patientSession = {
  status: 'inactive', // 'filling', 'inactive', 'submitted'
  data: { firstName: '', lastName: '', symptoms: '' }
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. ส่งข้อมูลล่าสุดให้คนที่เพิ่งเข้ามา (เช่น เจ้าหน้าที่เพิ่งเปิดหน้าจอ)
  socket.emit('session_update', patientSession);

  // 2. รับรู้เมื่อคนไข้เริ่มพิมพ์ หรือ ข้อมูลเปลี่ยน
  socket.on('patient_typing', (formData) => {
    patientSession.status = 'filling';
    patientSession.data = formData;
    socket.broadcast.emit('session_update', patientSession);
  });

  // 3. รับรู้เมื่อคนไข้หยุดพิมพ์ (Debounced จากหน้าบ้าน)
  socket.on('patient_idle', () => {
    if (patientSession.status !== 'submitted') {
      patientSession.status = 'inactive';
      socket.broadcast.emit('session_update', patientSession);
    }
  });

  // 4. รับรู้เมื่อคนไข้กด Submit ฟอร์มสำเร็จ
  socket.on('patient_submit', (finalData) => {
    patientSession.status = 'submitted';
    patientSession.data = finalData;
    io.emit('session_update', patientSession); // ส่งให้ทุกคนรวมถึงคนไข้ด้วย
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(4000, () => console.log('WebSocket Server running on port 4000'));