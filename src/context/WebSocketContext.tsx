import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type WebSocketContextType = {
    ws: WebSocket | null;
    isConnected: boolean;
};

const WebSocketContext = createContext<WebSocketContextType>({
    ws: null,
    isConnected: false,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const ws = new WebSocket('wss://bus-api.abhicracker.com');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connection established");
            ws.send(JSON.stringify({ type: "auth", token }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received:", message);

            if (message.type === "auth_response") {
                if (message.success) {
                    console.log("WebSocket authenticated");
                    setIsConnected(true);
                } else {
                    console.error("WebSocket authentication failed:", message.error);
                }
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
            console.warn("WebSocket closed");
            setIsConnected(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ ws: wsRef.current, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
