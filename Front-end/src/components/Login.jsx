import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '@/redux/authSlice';

const Login = () => {
  const [input, setInput] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const changeEventHandler = (e) => {
    setInput({
      ...input,
      [e.target.name]: e.target.value,
    });
  };

  const loginHandler = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!input.email || !input.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(input.email)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      setLoading(true);
      const API_URL = 'http://localhost:8080';
      const res = await axios.post(`${API_URL}/api/v1/user/login`, input, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      if (res.data.success) {
        dispatch(setAuthUser(res.data.user));
        navigate('/');
        toast.success(res.data.message);
        setInput({
          email: '',
          password: '',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(
        error.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // If user is logged in, don't render the form
  if (user) return null;

  return (
    <div className="flex items-center w-screen h-screen justify-center">
      <form
        onSubmit={loginHandler}
        className="shadow-lg flex flex-col gap-5 p-8 max-w-md w-full"
      >
        <div className="my-4">
          <h1 className="text-center font-bold text-xl">LOGO</h1>
          <p className="text-sm text-center">
            Login to see photos & videos from your friends
          </p>
        </div>

        <div>
          <Label htmlFor="email" className="font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={input.email}
            onChange={changeEventHandler}
            className="focus-visible:ring-transparent my-2"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <Label htmlFor="password" className="font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            name="password"
            value={input.password}
            onChange={changeEventHandler}
            className="focus-visible:ring-transparent my-2"
            placeholder="Enter your password"
            required
          />
        </div>

        {loading ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </Button>
        ) : (
          <Button type="submit">Login</Button>
        )}

        <span className="text-center text-sm">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Signup
          </Link>
        </span>
      </form>
    </div>
  );
};

export default Login;
