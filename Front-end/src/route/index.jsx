// routes/index.js
import { createBrowserRouter } from 'react-router-dom';
import ChatPage from '../components/ChatPage';
import EditProfile from '../components/EditProfile';
import Home from '../components/Home';
import Login from '../components/Login';
import MainLayout from '../components/MainLayout';
import Profile from '../components/Profile';
import Signup from '../components/Signup';
import ProtectedRoutes from '../components/ProtectedRoutes';

export const browserRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/profile/:id',
        element: <Profile />,
      },
      {
        path: '/account/edit',
        element: <EditProfile />,
      },
      {
        path: '/chat',
        element: <ChatPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
]);