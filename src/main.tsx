// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import BusesPage from "./pages/BusPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RouteGuard from "@/components/RouteGuard";
import { AuthProvider } from "@/context/AuthContext.tsx";
import { LoadingBarProvider } from '@/context/LoadingBarProvider.tsx';
import { Provider } from "react-redux";
import { store } from "@/store";
import { Toaster } from 'sonner';


createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <Provider store={store}>
        <LoadingBarProvider />
        <Toaster richColors position="bottom-center" closeButton
          expand
          duration={2000} />
        <Routes>
          <Route element={<RouteGuard />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/buses" element={<BusesPage />} />
          </Route>
        </Routes>
      </Provider>
    </AuthProvider>
  </BrowserRouter>
  // </StrictMode> 
);
