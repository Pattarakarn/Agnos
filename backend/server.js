
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let patientSessions = {};

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('dashboard_init', () => {
    const overviewSessions = {};
    Object.keys(patientSessions).forEach(id => {
      const { data, ...overview } = patientSessions[id];
      overviewSessions[id] = overview;
    });
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

  socket.on('patient_typing', ({ patientId, currentField, progress, formData,status }) => {
    console.log(status)
    patientSessions[patientId] = {
      id: patientId,
      status: 'Active',
      currentField: currentField, 
      progress: progress,         
      data: formData,             
      updatedAt: Date.now()
    };

    const { data, ...overview } = patientSessions[patientId];
    io.emit('single_session_update', overview);

    io.to(`room_patient_${patientId}`).emit('patient_full_data_response', patientSessions[patientId]);
    io.emit('single_session_update', patientSessions[patientId]);
  });

  socket.on('patient_focus_field', ({ patientId, currentField }) => {
    
    if (!patientSessions[patientId]) {
      patientSessions[patientId] = {
        id: patientId,
        status: 'Active',
        progress: 0,
        data: {},
        updatedAt: Date.now()
      };
    }

    patientSessions[patientId].currentField = currentField;
    patientSessions[patientId].status = 'Active'; 
    patientSessions[patientId].updatedAt = Date.now();

    io.emit('single_session_update', patientSessions[patientId]);
  });

  socket.on('patient_idle', ({ patientId }) => {
    if (patientSessions[patientId] && patientSessions[patientId].status !== 'Submitted') {
      patientSessions[patientId].status = 'Inactive';
      patientSessions[patientId].currentField = '';
      patientSessions[patientId].updatedAt = Date.now();

      const { data, ...overview } = patientSessions[patientId];
      io.emit('single_session_update', overview);
      io.to(`room_patient_${patientId}`).emit('patient_full_data_response', patientSessions[patientId]);
    }
  });

  socket.on('patient_submit', ({ patientId, finalData }) => {
    if (patientSessions[patientId]) {
      patientSessions[patientId].status = 'Submitted';
      patientSessions[patientId].progress = 100;
      patientSessions[patientId].data = finalData;

      io.emit('single_session_update', patientSessions[patientId]);

    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`WebSocket Server running on port ${PORT}`));