# MadadKaro - Service Marketplace Application

MadadKaro is a platform that connects customers with service providers (taskers) who can help them with various tasks like cleaning, handyman services, moving, delivery, and more.

## Features

- User authentication and role-based access (customer, tasker, admin)
- Task posting by customers
- Bidding system for taskers
- Real-time notifications for bid activities
- Messaging between customers and taskers
- Task management workflow
- Reviews and ratings

## New Features

### Real-time Notifications
- Customers receive real-time notifications when a tasker bids on their tasks
- Notification icon in the header shows unread notifications
- Notification panel shows all notifications with read/unread status
- Click on notifications to navigate directly to the relevant task

### Improved Bid Management
- Customers can now view all bids on their tasks in the task detail page
- Taskers can track their bid status
- Accept or reject bids with optional rejection reason

## Installation

1. Clone the repository
```
git clone https://github.com/yourusername/madadkaro.git
cd madadkaro
```

2. Install dependencies
```
npm run install-all
```

3. Configure environment variables
- Create a `.env` file in the `madadkaro-backend` directory with the following variables:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4. Start the development servers
```
npm run dev
```

This will start both the backend server and the frontend development server.

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO for real-time notifications

### Frontend
- React
- React Router
- Tailwind CSS
- Axios
- Socket.IO Client

## Project Structure

- `/madadkaro-backend` - Backend API server
- `/madadkaro-frontend` - Frontend React application

## Contributors

- Your Name - Initial work

## License
This project is licensed under the MIT License. 