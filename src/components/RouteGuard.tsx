"use client";

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setUser } from "@/store/userSlice";
import { fetchUserData } from "@/api";
import { useEffect } from "react";


export default function RouteGuard() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();


  const publicRoutes = ["/login"]; 
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    fetchUserData().then((data) => {
      dispatch(setUser(data));
    }).catch(err => {
      console.error("Error fetching user:", err);
    });

  }, [isAuthenticated, isPublicRoute, dispatch]);

  if (isAuthenticated && isPublicRoute) {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
