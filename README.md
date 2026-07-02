# 💰 SpendWise - Personal Finance Manager

SpendWise is a full-stack web application designed to help users manage personal expenses, track spending habits, and improve financial awareness. It provides a simple dashboard for expense tracking and includes an AI-powered assistant for basic financial guidance.

---

## 🚀 Live Demo

🌐 **Frontend (Vercel):**  
https://spendwise-nine-rust.vercel.app  

🖥️ **Backend (Render):**  
https://spendwise-backend-4qp1.onrender.com  

🔍 **Health Check API:**  
https://spendwise-backend-4qp1.onrender.com/health  

---

## 🎯 Project Objective

The objective of SpendWise is to build a practical personal finance management system that helps users:
- Track daily expenses
- Analyze spending patterns
- Improve budgeting discipline
- Get basic AI-based financial insights

---

## ✨ Features

- User Authentication (Signup & Login using JWT)
- Secure token-based authentication system
- Add, view, and manage expenses
- Responsive and clean dashboard UI
- REST API integration between frontend and backend
- AI-powered financial assistant (chat-based suggestions)

---

## 🛠️ Tech Stack

### Frontend
- React.js
- JavaScript (ES6+)
- HTML5
- CSS3
- Fetch API

### Backend
- Flask (Python)
- Flask-JWT-Extended
- Flask-CORS
- SQLAlchemy
- SQLite Database

---

## 📁 Project Structure

```
SpendWise/
│
├── backend/
│   ├── config/
│   ├── database/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── .gitignore
│
└── README.md
```

---

## ⚙️ Installation Guide

### 1️⃣ Clone Repository

```bash
git clone https://github.com/vaibhaviabnave19-dev/Spendwise.git
cd Spendwise
```

---

### 2️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend will run at:
```
http://localhost:5000
```

---

### 3️⃣ Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend will run at:
```
http://localhost:3000
```

---

## 🔐 Environment Variables

### Frontend (Vercel)

```
REACT_APP_API_URL = https://spendwise-backend-4qp1.onrender.com
```

---

## 🔮 Future Improvements

- Advanced analytics dashboard with charts
- Budget planning system
- Monthly expense reports
- Email notifications
- Mobile application (React Native)
- Enhanced AI financial assistant

---

## 👩‍💻 Internship Project Highlights

This project demonstrates practical skills in:

- Full-stack web development
- REST API design and integration
- Authentication and authorization (JWT)
- Frontend-backend communication
- Cloud deployment (Vercel & Render)
- Real-world project structuring and debugging

---

## 👤 Author

**Vaibhavi Abnave**  
GitHub: https://github.com/vaibhaviabnave19-dev