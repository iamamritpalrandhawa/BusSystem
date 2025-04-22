// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import HomePage from "./pages/HomePage.tsx";
import BusesPage from "./pages/BusPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import CreateRoute from "./pages/CreateRoute.tsx";
import RouteGuard from "@/components/RouteGuard";
import StudentPage from "./pages/StudentPage.tsx";
import RoutePage from "./pages/RoutePage.tsx";
import UpdateRoute from "./pages/UpdateRoute.tsx";
import SchedulePage from "@/pages/SchedulePage.tsx";
import UpdateSchedule from "@/pages/UpdateSchedule.tsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext.tsx";
import { LoadingBarProvider } from '@/context/LoadingBarProvider.tsx';
import { WebSocketProvider } from './context/WebSocketContext';
import { CreateSchedule } from "@/pages/CreateSchedule.tsx"
import { Provider } from "react-redux";
import { store } from "@/store";
import { Toaster } from 'sonner';


createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <Provider store={store}>
        <WebSocketProvider>
          <LoadingBarProvider />
          <Toaster richColors position="bottom-center" closeButton
            expand
            duration={2000} />
          <Routes>
            <Route element={<RouteGuard />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/route" element={<CreateRoute />} />
              <Route path="/route/:id" element={<UpdateRoute />} />
              <Route path="/routes" element={<RoutePage />} />
              <Route path="/schedules" element={<SchedulePage />} />
              <Route path="/buses" element={<BusesPage />} />
              <Route path="/students" element={<StudentPage />} />
              <Route path="/schedule" element={<CreateSchedule />} />
              <Route path="/schedule/:id" element={<UpdateSchedule />} />
            </Route>
          </Routes>
        </WebSocketProvider>
      </Provider>
    </AuthProvider>
  </BrowserRouter>
  // </StrictMode> 
);
