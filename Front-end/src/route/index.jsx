
// import ChatPage from './components/ChatPage';
// import EditProfile from './components/EditProfile';
// import Home from './components/Home';
// import MainLayout from './components/MainLayout';
// import Profile from './components/Profile';
// import ProtectedRoutes from './components/ProtectedRoutes';
import Signup from '../components/Signup.jsx';
import Login from './components/Login.jsx';
// Định nghĩa router
const browserRouter = ([
  // {
  //   path: '/',
  //   element: <ProtectedRoutes><MainLayout /></ProtectedRoutes>,
  //   children: [
  //     {
  //       path: '/',
  //       element: <ProtectedRoutes><Home /></ProtectedRoutes>,
  //     },
  //     {
  //       path: '/profile/:id',
  //       element: <ProtectedRoutes><Profile /></ProtectedRoutes>,
  //     },
  //     {
  //       path: '/account/edit',
  //       element: <ProtectedRoutes><EditProfile /></ProtectedRoutes>,
  //     },
  //     {
  //       path: '/chat',
  //       element: <ProtectedRoutes><ChatPage /></ProtectedRoutes>,
  //     },
  //   ],
  // },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
]);

export default browserRouter;


