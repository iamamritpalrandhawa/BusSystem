"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bus } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setUser } from "@/store/userSlice";
import { setProgress } from '@/store/progressSlice';
import { toast } from 'sonner';


export default function LoginPage({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const router = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const dispatch = useDispatch<AppDispatch>();


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            dispatch(setProgress(30));
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: email,
                    password: password,
                }),
            });
            dispatch(setProgress(60));
            const data = await response.json();

            if (response.ok && data.success) {
                dispatch(setProgress(90));
                localStorage.setItem("token", data.token);
                dispatch(setUser(data.user));
                login();
                dispatch(setProgress(100));

                router("/");
                toast.success('Login successful!');
            } else {
                dispatch(setProgress(100));
                setError(data.message || "Login failed. Please try again.");
                toast.error('Something went wrong.');
            }
        } catch (err) {
            dispatch(setProgress(100));
            console.error(err);
            setError("An unexpected error occurred. Please try again later.");
            toast.error('Something went wrong.');
        }
    };

    return (
        <div className="w-full">
            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                <div className={cn("flex flex-col gap-6", className)} {...props}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                <Bus className="w-12 h-12 mr-4 text-blue-600 inline" />
                                Login
                            </CardTitle>
                            <CardDescription>
                                Enter your email below to login to your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin}>
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="text"
                                            placeholder="abc@mail.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    <Button type="submit" className="w-full">
                                        Login
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
