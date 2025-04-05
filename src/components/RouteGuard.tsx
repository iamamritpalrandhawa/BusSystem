// src/components/RouteGuard.tsx
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


  const publicRoutes = ["/login"]; // Add more public routes if needed
  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    fetchUserData().then((data) => {
      dispatch(setUser(data));
    }).catch(err => {
      console.error("Error fetching user:", err);
    });

  }, [isAuthenticated, isPublicRoute, dispatch]);

  // ✅ If authenticated and trying to access a public route (like /login), redirect to home
  if (isAuthenticated && isPublicRoute) {
    return <Navigate to="/" replace />;
  }

  // ✅ If not authenticated and trying to access private route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Otherwise, allow access
  return <Outlet />;
}
