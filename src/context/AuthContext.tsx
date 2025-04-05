import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";

interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return !!localStorage.getItem("token");
        }
        return false;
    });

    const login = () => setIsAuthenticated(true);

    const logout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        toast.success('Logout successful!');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
