import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Bus, Route, Clock, MapPin, User, Calendar } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Nabvar';
import L from 'leaflet';
import { useWebSocket } from "../context/WebSocketContext";
import React, { useEffect, useState } from 'react';
import { Bus as BusType, Route as RouteType, Student, ScheduleItem } from "@/types";
import { fetchBuses, fetchRoutes, fetchAllStudents, fetchSchedules } from '@/api';
import { format } from 'date-fns-tz';
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setProgress } from '@/store/progressSlice';
import { toast } from 'sonner';



const HomePage = () => {


  const [activeBuses, setActiveBuses] = useState<BusType[]>([]);
  const [activeRoutes, setActiveRoutes] = useState<RouteType[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [activeSchedules, setActiveSchedules] = useState<ScheduleItem[]>([]);
  const dispatch = useDispatch<AppDispatch>();


  const [upcomingSchedules, setUpcomingSchedules] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch(setProgress(10));
        const buses = await fetchBuses();
        dispatch(setProgress(30));

        const routes = await fetchRoutes();
        dispatch(setProgress(50));

        const students = await fetchAllStudents();
        dispatch(setProgress(70));

        const schedules = await fetchSchedules();
        dispatch(setProgress(90));

        const today = new Date();
        const todayDay = today.toLocaleDateString('en-US', { weekday: 'short' });

        const todaySchedules = schedules
          .filter((s: ScheduleItem) =>
            !s.isOneTime && s.repeatDays.includes(todayDay)
          );
        setUpcomingSchedules(todaySchedules);

        setActiveBuses(buses.filter((bus: BusType) => bus.id));
        setActiveRoutes(routes.filter((route: RouteType) => route.id));
        setActiveStudents(students.filter((student: Student) => student.id));
        setActiveSchedules(schedules.filter((schedule: ScheduleItem) => schedule.id));

        dispatch(setProgress(100));
        setTimeout(() => dispatch(setProgress(0)), 500);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to load dashboard data. Please try again.");
        dispatch(setProgress(100));
      }
    };

    fetchData();
  }, [dispatch]);
  const formatScheduleTime = (startTime: string) => {
    const date = new Date(startTime);
    return format(date, 'hh:mm a');
  };
  const [busLocations, setBusLocations] = useState<Record<string, { lat: number; lng: number; hdop: number }>>({});
  const busLocationIcon = L.divIcon({
    html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
  const { ws, isConnected } = useWebSocket();
  useEffect(() => {
    if (isConnected && ws) {
      activeBuses.forEach((bus) => {
        ws.send(JSON.stringify({ type: 'get_loc', busNumber: bus.number }));
      });

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'location') {
          const { lat, lng, hdop } = message.data;
          const busNumber = message.busNumber;

          setBusLocations((prev) => ({
            ...prev,
            [busNumber]: { lat, lng, hdop },
          }));
        }

        console.log("Live Bus Data:", message);
      };
    }
  }, [isConnected, ws, activeBuses]);

  return (
    <>
      <Navbar />
      <div className="px-6 py-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Active Buses"
            count={activeBuses.length}
            icon={<Bus className="w-6 h-6 text-green-600" />}
            iconBg="bg-green-100"
          />
          <SummaryCard
            title="Active Routes"
            count={activeRoutes.length}
            icon={<Route className="w-6 h-6 text-blue-600" />}
            iconBg="bg-blue-100"
          />
          <SummaryCard
            title="Active Students"
            count={activeStudents.length}
            icon={<User className="w-6 h-6 text-purple-600" />}
            iconBg="bg-purple-100"
          />
          <SummaryCard
            title="Active Schedules"
            count={activeSchedules.length}
            icon={<Calendar className="w-6 h-6 text-yellow-600" />}
            iconBg="bg-yellow-100"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl shadow-md hover:shadow-lg p-4 border">
            <h2 className="text-lg font-semibold flex items-center mb-2">
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
                {activeBuses.map((bus) => {
                  const location = busLocations[bus.number];
                  if (!location) return null;

                  return (
                    <React.Fragment key={bus.id}>
                      <Marker position={[location.lat, location.lng]} icon={busLocationIcon}>
                        <Popup>
                          <div>
                            <strong>Bus {bus.number}</strong><br />
                            Model: {bus.model}<br />
                            Driver: {bus.driverName}<br />
                            Contact: {bus.driverNumber}<br />
                            Capacity: {bus.capacity}
                          </div>
                        </Popup>
                      </Marker>
                      <Circle
                        center={[location.lat, location.lng]}
                        radius={location.hdop ? location.hdop * 20 : 50}
                        pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
                      />
                    </React.Fragment>
                  );
                })}

              </MapContainer>
            </div>
          </div>

          <div className="rounded-xl shadow-md hover:shadow-lg p-4 border">
            <h2 className="text-lg font-semibold flex items-center mb-2">
              <Clock className="w-5 h-5 mr-2" />
              Upcoming Departures
            </h2>
            <div className="space-y-4">
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{schedule.route.name}</p>
                      <p className="text-sm text-gray-500">Bus: {schedule.bus.number}</p>
                    </div>
                    <p className="text-sm font-semibold text-blue-600">{formatScheduleTime(schedule.startTime)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/schedules" className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-800">
              View Full Schedule →
            </Link>
          </div>
        </div>

        <div className="rounded-xl shadow-md hover:shadow-lg p-4 border">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/route" className="flex-1 p-4 border rounded-lg text-center shadow-md hover:shadow-lg transition">
              <Route className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Add New Route</p>
            </Link>
            <Link to="/buses?type=create" className="flex-1 p-4 border rounded-lg text-center shadow-md hover:shadow-lg transition">
              <Bus className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Add New Bus</p>
            </Link>
            <Link to="/schedule" className="flex-1 p-4 border rounded-lg text-center shadow-md hover:shadow-lg transition">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Add New Schedule</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SummaryCard = ({ title, count, icon, iconBg }: { title: string; count: number; icon: any; iconBg: string }) => (
  <div className="rounded-xl shadow-md hover:shadow-lg px-6 py-4 border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className="text-2xl font-bold">{count}</h3>
      </div>
      <div className={`${iconBg} p-3 rounded-xl`}>
        {icon}
      </div>
    </div>
  </div>
);

export default HomePage;
