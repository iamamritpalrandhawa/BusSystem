import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Bus, Route, Clock, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Nabvar';
import L from 'leaflet';
import { useWebSocket } from "../context/WebSocketContext";
import { useEffect, useState } from 'react';



const activeBuses = [
    { id: '1', number: 'BUS-101', capacity: 40, model: 'Volvo 9400', status: 'active', },
    { id: '2', number: 'BUS-102', capacity: 35, model: 'Mercedes-Benz Citaro', status: 'active', }
];

const routes = [
    { id: 'R1', name: 'Golden Temple - Amritsar Junction', startLocation: 'Golden Temple', endLocation: 'Amritsar Junction' },
    { id: 'R2', name: 'Ranjit Avenue - Wagah Border', startLocation: 'Ranjit Avenue', endLocation: 'Wagah Border' }
];

const busLocations = [
    { id: 1, position: [31.619980, 74.876485], busNumber: 'BUS-101' }, 
];
const upcomingSchedules = [
    { id: 1, busNumber: 'BUS-101', route: 'Golden Temple - Amritsar Junction', departure: '08:00 AM' },
    { id: 2, busNumber: 'BUS-102', route: 'Ranjit Avenue - Wagah Border', departure: '08:30 AM' },
    { id: 3, busNumber: 'BUS-103', route: 'Amritsar Junction - Airport', departure: '09:00 AM' },
    { id: 4, busNumber: 'BUS-104', route: 'Golden Temple - Jallianwala Bagh', departure: '09:15 AM' },
];



const HomePage = () => {
    const [busLocation, setBusLocation] = useState<{ lat: number; lng: number, hdop: number; } | null>(null);

    const busLocationIcon = L.divIcon({
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>`,
        className: '', 
        iconSize: [16, 16],
        iconAnchor: [8, 8], 
    });


    const { ws, isConnected } = useWebSocket();

    useEffect(() => {
        if (isConnected && ws) {
            ws.send(JSON.stringify({ type: 'get_loc', busNumber: '36' }));

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log("🚀 ~ useEffect ~ message:", message)

                if (message.type === 'location' && message.busNumber === '36') {
                    const { lat, lng, hdop } = message.data;
                    console.log("🚀 ~ useEffect ~ lng:", lng)
                    console.log("🚀 ~ useEffect ~ lat:", lat)
                    setBusLocation({ lat, lng, hdop });
                }

                console.log("Live Bus Data:", message);
            };
        }
    }, [isConnected, ws]);

    return (
        <>
            <Navbar />
            <div className="px-6 py-3 space-y-3  ">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-xl shadow-md hover:shadow-lg px-6 py-3 border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Active Buses</p>
                                <h3 className="text-2xl font-bold">{activeBuses.length}</h3>
                            </div>
                            <div className="bg-green-100 p-3 rounded-xl">
                                <Bus className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl shadow-md hover:shadow-lg px-6 py-3 border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Active Routes</p>
                                <h3 className="text-2xl font-bold">{routes.length}</h3>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Route className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Map */}
                    <div className="lg:col-span-2 rounded-xl shadow-md hover:shadow-lg  p-4 border">
                        <h2 className="text-lg font-semibold  flex items-center mb-2">
                            <MapPin className="w-5 h-5 mr-2" />
                            Live Bus Locations
                        </h2>
                        <div className="h-[400px] rounded-lg overflow-hidden z-0 relative">

                            <MapContainer
                                center={[31.6340, 74.8723]}
                                zoom={13}
                                className="h-full w-full"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {busLocation && busLocations.map((bus) => (
                                    <>
                                        <Marker key={bus.id} position={[busLocation.lat, busLocation.lng]}
                                            icon={busLocationIcon}
                                        >
                                            <Popup>Bus {bus.busNumber}</Popup>
                                        </Marker>
                                        <Circle
                                            center={[busLocation.lat, busLocation.lng]}
                                            radius={busLocation.hdop ? busLocation.hdop * 20 : 50} 
                                            pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
                                        />
                                    </>
                                ))}

                                

                     {/* 
                                    {stops.length > 1 && <Polyline positions={routePolyline} color="blue" />} */}
                                {/* {stops.map((stop, index) => (
                                    <Marker
                                        key={stop.id}
                                        position={[stop.latitude, stop.longitude]}
                                        icon={index === 0 ? startIcon : index === stops.length - 1 ? endIcon : defaultIcon}
                                    >
                                        <Popup>
                                            <div className="text-center space-y-1" style={{ minWidth: '120px', padding: '4px' }}>
                                                <MapPin className="inline-block text-primary mb-1" size={14} />
                                                <p className="font-medium text-sm">{stop.stopName}</p>
                                                <p className="text-xs text-gray-600">Stop #{stop.stopOrder}</p>
                                                {stop.distanceFromPrevious > 0 && (
                                                    <p className="text-xs text-gray-600">
                                                        Distance: {stop.distanceFromPrevious.toFixed(2)} km
                                                    </p>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))} */}
                            </MapContainer>
                        </div>
                    </div>

                  
                    <div className="rounded-xl shadow-md hover:shadow-lg  p-4 border">
                        <h2 className="text-lg font-semibold flex items-center mb-2">
                            <Clock className="w-5 h-5 mr-2" />
                            Upcoming Departures
                        </h2>
                        <div className="space-y-4">
                            {upcomingSchedules.map((schedule) => (
                                <div key={schedule.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{schedule.route}</p>
                                            <p className="text-sm text-gray-500">Bus: {schedule.busNumber}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-blue-600">{schedule.departure}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/dashboard/routes" className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800">
                            View Full Schedule →
                        </Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl shadow-md hover:shadow-lg  p-4 border">
                    <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/dashboard/routes" className="p-4 border rounded-lg hover: text-center shadow-md">
                            <Route className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm font-medium">Add New Route</p>
                        </Link>
                        <Link to="/dashboard/buses" className="p-4 border rounded-lg hover: text-center shadow-md">
                            <Bus className="w-6 h-6 mx-auto mb-2 text-green-600" />
                            <p className="text-sm font-medium">Add New Bus</p>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HomePage;
