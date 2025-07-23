EvenSteven is a mobile-first app designed to help friend groups effortlessly split expenses, track group balances, and settle up with each other—ideal for group trips, events, or shared purchases.

🧩 Monorepo Structure
bash
Copy
Edit
EvenSteven/
├── frontend/         # React + Vite + Tailwind
└── backend/          # Node.js + Express (Django optional for admin)
🖼 Frontend – /frontend
Built with:

Vite + React + TypeScript

TailwindCSS for styling

React Router for screen transitions

Context API or Zustand for state management (optional)

🔧 Setup
bash
Copy
Edit
cd frontend
npm install
npm run dev
🗺 Pages
/ – Home screen (New Group / Join Group)

/create-group – Create a new group

/join-group – Join group using code

/group/:id – Group dashboard & overview

/group/:id/add-expense – Add a shared expense

/group/:id/add-payment – Record payment between members

/group/:id/add-person – Add someone new

📦 Features
Clean, responsive UI (mobile-first)

Reusable components (buttons, inputs, cards)

Invite code system

Real-time balance updates (via API)

Custom split support

⚙️ Backend – /backend
Built with:

Node.js + Express

MongoDB (or PostgreSQL)

JWT-based Authentication (optional)

REST API for frontend to consume

🔧 Setup
bash
Copy
Edit
cd backend
npm install
npm run dev
Make sure .env contains:

env
Copy
Edit
PORT=5000
MONGO_URI=mongodb://localhost:27017/evensteven
JWT_SECRET=your_secret_key
📁 API Structure
Endpoint	Method	Description
/groups	POST	Create group
/groups/:id	GET	Get group detail
/groups/:id/expenses	POST	Add new expense
/groups/:id/payments	POST	Record a payment
/groups/:id/members	POST	Add new person
/groups/join/:code	POST	Join group by code

🧰 Admin (Optional with Django)
If using Django for admin:

Admin panel for managing users and viewing financials

Connect via API or shared DB

Useful for enterprise-style analytics or team-level control

📌 Tech Stack
Layer	Tech
Frontend	React + Vite + TS + Tailwind
Backend	Node.js + Express
Database	MongoDB or PostgreSQL
Optional	Django (admin interface)

👨‍👩‍👧‍👦 Use Case Example
Alice creates a group for her trip to Bali.

Bob and Carla join using the invite code.

Each time someone pays, they log an expense.

The app calculates who owes what to whom.

At the end, one tap shows how to settle up fairly.



<div align="center">
  <a href="https://shipwrecked.hackclub.com/?t=ghrm" target="_blank">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/739361f1d440b17fc9e2f74e49fc185d86cbec14_badge.png" 
         alt="This project is part of Shipwrecked, the world's first hackathon on an island!" 
         style="width: 35%;">
  </a>
</div>
