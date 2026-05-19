# Real-time Patient Input Form and Staff View System

## Overview

This project is a real-time patient intake and monitoring system.

Patients can submit information through a form interface, while staff users can monitor updates in real time through a dedicated dashboard.

---

## Tech Stack
- Next.js
- Tailwind CSS
- Node.js
- WebSocket 

---

## Features

- Patient input form
- Real-time synchronization
- Staff dashboard view
- Active/inactive patient status
- Form validation

---

## Monorepo Structure

/frontend
Next.js frontend application

/backend
WebSocket server 

---

## Setup

### Requirements

- Node.js >= 20

### Environment Variables

Create `frontend/.env`

```env
NEXT_PUBLIC_SOCKET_URL=your_websocket_url
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm start
```

---

## Real-time Flow
1. Patient updates form
2. Frontend sends update through WebSocket
3. Backend broadcasts websocket event
4. Staff dashboard receives update instantly