# MERN Stack Messaging App

This is a full-stack MERN (MongoDB, Express, React, Node.js) application for CS314.

## Project Structure

```
Messaging-App-CS314/
├── backend/          # Express.js server
│   ├── index.js      # Main server file
│   ├── .env          # Backend environment variables
│   └── package.json
├── frontend/         # React application
│   ├── src/
│   ├── .env          # Frontend environment variables
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v22.12.0 or higher)
- npm (10.9.0 or higher)
- MongoDB (Local installation or MongoDB Atlas)

## MongoDB Setup

### Option 1: Local MongoDB (Recommended for Development)

1. Download MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Install MongoDB following the platform-specific instructions
3. Start MongoDB service:
   - **Windows**: Run `net start MongoDB` (as Administrator) or use Services GUI
   - **macOS**: Run `brew services start mongodb-community`
   - **Linux**: Run `sudo systemctl start mongod`

### Option 2: MongoDB Atlas (Cloud)

1. Sign up at https://www.mongodb.com/atlas
2. Create a free M0 cluster
3. Configure network access to allow your IP
4. Create a database user
5. Get your connection string
6. Update `backend/.env` with your Atlas connection string:
   ```
   DATABASE_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/messaging-app
   ```

## Installation

### Backend Setup

```bash
cd backend
npm install
```

The backend dependencies are already installed:
- express - Web framework
- mongoose - MongoDB ODM
- cors - Cross-origin resource sharing
- dotenv - Environment variables

### Frontend Setup

```bash
cd frontend
npm install
```

The frontend dependencies are already installed:
- React - UI library
- Vite - Build tool
- axios - HTTP client
- react-router-dom - Routing

## Configuration

### Backend Environment Variables (backend/.env)

```
PORT=8747
DATABASE_URI=mongodb://localhost:27017/messaging-app
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables (frontend/.env)

```
VITE_SERVER_URL=http://localhost:8747
```

## Running the Application

You need to run both the backend and frontend simultaneously in separate terminals.

### Terminal 1: Start the Backend

```bash
cd backend
node index.js
```

Expected output:
```
Server running on http://localhost:8747
MongoDB Connected
```

### Terminal 2: Start the Frontend

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v7.x.x ready in 157 ms
-> Local: http://localhost:5173/
```

## Verification

1. Open your browser and navigate to http://localhost:5173
2. You should see the React app with a "Backend Status" section
3. If the backend is connected, the status will show "connected" with a green background
4. If there's an error, the status will show "error" with a red background

## Troubleshooting

### MongoDB Connection Errors

- **Local MongoDB**: Ensure MongoDB service is running
  - Windows: Check Services (`services.msc`) for "MongoDB Server"
  - macOS/Linux: Run `mongosh` to test connection
- **Atlas**: Check network access settings and verify connection string

### Backend Not Starting

- Check if port 8747 is already in use
- Verify all dependencies are installed: `cd backend && npm install`
- Check `.env` file exists and has correct values

### Frontend Not Connecting to Backend

- Ensure backend is running on port 8747
- Check `frontend/.env` has correct `VITE_SERVER_URL`
- Verify CORS settings in `backend/index.js`

## Next Steps

- Add user authentication
- Create message models and routes
- Build messaging UI components
- Implement real-time messaging with Socket.IO
- Add user profiles and contacts

## Resources

- [MERN Stack Tutorial PDF](./MERN%20Stack%20Installation%20Tutorial.pdf)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
