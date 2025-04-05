import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Bus, Route, Clock, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { Bus as BusType, Route as RouteType } from '../types';
import Navbar from '@/components/Nabvar';

const activeBuses: BusType[] = [
    { id: '1', number: 'BUS-101', capacity: 40, model: 'Volvo 9400', routeId: 'R1', status: 'active', schedules: [] },
    { id: '2', number: 'BUS-102', capacity: 35, model: 'Mercedes-Benz Citaro', routeId: 'R2', status: 'active', schedules: [] }
];

const routes: RouteType[] = [
    { id: 'R1', name: 'Golden Temple - Amritsar Junction', startLocation: 'Golden Temple', endLocation: 'Amritsar Junction', stops: ['Hall Bazaar', 'Bus Stand', 'Railway Station'], distance: 6, estimatedDuration: 20 },
    { id: 'R2', name: 'Ranjit Avenue - Wagah Border', startLocation: 'Ranjit Avenue', endLocation: 'Wagah Border', stops: ['Chheharta', 'Attari'], distance: 30, estimatedDuration: 50 }
];

const busLocations = [
    { id: 1, position: [31.619980, 74.876485], busNumber: 'BUS-101' }, // Near Golden Temple
    { id: 2, position: [31.633980, 74.872260], busNumber: 'BUS-102' }  // Near Amritsar Junction
];
const upcomingSchedules = [
    { id: 1, busNumber: 'BUS-101', route: 'Golden Temple - Amritsar Junction', departure: '08:00 AM' },
    { id: 2, busNumber: 'BUS-102', route: 'Ranjit Avenue - Wagah Border', departure: '08:30 AM' },
    { id: 3, busNumber: 'BUS-103', route: 'Amritsar Junction - Airport', departure: '09:00 AM' },
    { id: 4, busNumber: 'BUS-104', route: 'Golden Temple - Jallianwala Bagh', departure: '09:15 AM' },
];



const HomePage = () => {
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
                        <div className="h-[400px] rounded-lg overflow-hidden ">
                            <MapContainer center={[31.6340, 74.8723]} zoom={13} className="h-full w-full">
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {busLocations.map((bus) => (
                                    <Marker key={bus.id} position={bus.position as [number, number]}>
                                        <Popup>Bus {bus.busNumber}</Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>

                    {/* Upcoming Schedules */}
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
