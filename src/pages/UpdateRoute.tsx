import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Plus, Trash2, Timer, Route as RouteIcon, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { useParams } from 'react-router-dom';
import { CSS } from '@dnd-kit/utilities';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import Navbar from '@/components/Nabvar';
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setProgress } from '@/store/progressSlice';
import { toast } from 'sonner';

import { fetchRoute, updateRoute, updateStops } from '@/api';
import { useNavigate } from 'react-router-dom';

const defaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const startIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [30, 46],
    iconAnchor: [15, 46],
    className: 'start-marker',
});

const endIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [30, 46],
    iconAnchor: [15, 46],
    className: 'end-marker',
});

const routeSchema = z.object({
    name: z.string().min(3, 'Route name must be at least 3 characters'),
});

type RouteFormData = z.infer<typeof routeSchema>;

interface Stop {
    id: string;
    stopName: string;
    latitude: number;
    longitude: number;
    stopOrder: number;
    distanceFromPrevious: number;
    estimatedTime: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

function estimateTravelTime(distance: number): number {
    const averageSpeed = 35; 
    return (distance / averageSpeed) * 60; 
}


function MapEvents({ onMapClick }: { onMapClick: (latlng: LatLng) => void }) {
    useMapEvents({
        click: (e) => onMapClick(e.latlng),
    });
    return null;
}

function SortableStop({ stop, onRemove, onClick }: { stop: Stop; onRemove: (id: string) => void; onClick: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: stop.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <motion.li
            ref={setNodeRef}
            style={style}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors flex"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <div {...attributes} {...listeners} className="cursor-move text-white/60 hover:text-white/80 transition-colors">
                        <div className="w-6 h-6 flex items-center justify-center">⋮⋮</div>
                    </div>
                    <span className="font-medium text-white">{stop.stopName}</span>
                </div>
                <div className="mt-2 space-y-2 text-sm text-white/70">
                    <p className="flex items-center gap-2">
                        <MapPin size={16} />
                        {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                    </p>
                    {stop.distanceFromPrevious > 0 && (
                        <p className="flex items-center gap-2">
                            <RouteIcon size={16} />
                            Distance: {stop.distanceFromPrevious.toFixed(2)} km
                        </p>
                    )}
                    {stop.estimatedTime > 0 && (
                        <p className="flex items-center gap-2">
                            <Timer size={16} />
                            Est. time: {stop.estimatedTime.toFixed(0)} min
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
                <button
                    onClick={() => onClick(stop.id)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full transition-colors"
                >
                    <Edit size={18} />
                </button>
                <button
                    onClick={() => onRemove(stop.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </motion.li>
    );
}

export default function UpdateRoute() {
    const [stops, setStops] = useState<Stop[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
    const [stopName, setStopName] = useState('');
    const [editingStopId, setEditingStopId] = useState<string | null>(null);
    const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
    const dispatch = useDispatch<AppDispatch>();
    const { id: routeId } = useParams<{
        id: string;
    }>();
    const navigate = useNavigate();

    async function getNearestRoad(lat: number, lng: number): Promise<{ lat: number; lng: number } | null> {
        try {
            const response = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`);
            const data = await response.json();
            if (data?.waypoints?.length > 0) {
                const { location } = data.waypoints[0];
                return { lat: location[1], lng: location[0] };
            }
            return null;
        } catch (error) {
            console.error('Error fetching nearest road point:', error);
            return null;
        }
    }
    async function fetchRoutePolyline(stops: Stop[]): Promise<[number, number][]> {
        if (stops.length < 2) return [];

        const coordinates = stops.map(stop => `${stop.longitude},${stop.latitude}`).join(';');

        try {
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
            }
        } catch (error) {
            console.error('Error fetching route polyline:', error);
        }

        return [];
    }
    useEffect(() => {
        async function updatePolyline() {
            const polyline = await fetchRoutePolyline(stops);
            setRoutePolyline(polyline);
        }

        if (stops.length > 1) {
            updatePolyline();
        } else {
            setRoutePolyline([]);
        }
    }, [stops]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { register, handleSubmit, formState: { errors }, reset } = useForm<RouteFormData>({
        resolver: zodResolver(routeSchema),
    });
    useEffect(() => {
        const fetchData = async () => {
            if (!routeId) return;

            const route = await fetchRoute(routeId);

            if (route) {
                reset({ name: route.name });

                const fetchedStops = route?.stops?.map((stop: Stop) => ({
                    id: stop.id,
                    stopName: stop.stopName,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    stopOrder: stop.stopOrder,
                    distanceFromPrevious: stop.distanceFromPrevious,
                    estimatedTime: stop.estimatedTime,
                }));

                setStops(updateDistances(fetchedStops));
            } else {
                toast.error("Failed to load route.");
            }
        };

        fetchData();
    }, [routeId]);



    const handleMapClick = async (latlng: LatLng) => {
        const nearest = await getNearestRoad(latlng.lat, latlng.lng);
        if (!nearest) {
            toast.error('No road nearby. Please select a point closer to a road.');
            return;
        }
        if (editingStopId) {
            setStops((prevStops) => {
                const updatedStops = prevStops.map((stop) => {
                    if (stop.id === editingStopId) {
                        return { ...stop, latitude: nearest.lat, longitude: nearest.lng };
                    }
                    return stop;
                });
                return updateDistances(updatedStops);
            });
            setEditingStopId(null); 
        } else {
            setSelectedLocation(new LatLng(nearest.lat, nearest.lng));
        }
    };

    const updateDistances = (newStops: Stop[]): Stop[] => {
        return newStops.map((stop, index) => {
            if (index === 0) {
                return { ...stop, distanceFromPrevious: 0, estimatedTime: 0 };
            }
            const prevStop = newStops[index - 1];
            const distance = calculateDistance(
                prevStop.latitude,
                prevStop.longitude,
                stop.latitude,
                stop.longitude
            );
            const time = estimateTravelTime(distance);
            return { ...stop, distanceFromPrevious: distance, estimatedTime: time };
        });
    };

    const handleAddStop = () => {
        if (selectedLocation && stopName) {
            const newStop: Stop = {
                id: Math.random().toString(36).substr(2, 9),
                stopName,
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                stopOrder: stops.length + 1,
                distanceFromPrevious: 0,
                estimatedTime: 0,
            };

            setStops(prevStops => {
                const newStops = [...prevStops, newStop];
                return updateDistances(newStops);
            });
            setSelectedLocation(null);
            setStopName('');
        }
    };

    const handleRemoveStop = (stopId: string) => {
        const newStops = stops.filter((stop) => stop.id !== stopId);
        setStops(updateDistances(newStops));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setStops((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newStops = arrayMove(items, oldIndex, newIndex).map((stop, index) => ({
                    ...stop,
                    stopOrder: index + 1,
                }));
                return updateDistances(newStops);
            });
        }
    };

    const totalDistance = useMemo(() => {
        return stops.reduce((acc, stop) => acc + stop.distanceFromPrevious, 0);
    }, [stops]);

    const totalTime = useMemo(() => {
        return stops.reduce((acc, stop) => acc + stop.estimatedTime, 0);
    }, [stops]);

    const onSubmit = async (data: RouteFormData) => {
        if (stops.length < 2) {
            toast.error('Please add at least two stops to update the route');
            return;
        }

        const routeData: {
            name: string;
            startLocation: string;
            endLocation: string;
            distanceKm: number;
            totalTime: string;
        } = {
            name: data.name,
            startLocation: stops[0].stopName,
            endLocation: stops[stops.length - 1].stopName,
            distanceKm: totalDistance,
            totalTime: String(totalTime),
        };

        try {
            const routeResponse = await updateRoute(routeId, routeData);

            if (routeResponse.success) {
                const stopsData: {
                    stopName: string;
                    latitude: number;
                    longitude: number;
                    stopOrder: number;
                    distanceFromPrevious: number;
                    estimatedTime: number;
                }[] = stops.map((stop) => ({
                    stopName: stop.stopName,
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                    stopOrder: stop.stopOrder,
                    distanceFromPrevious: stop.distanceFromPrevious,
                    estimatedTime: stop.estimatedTime,
                }));

                const saveResponse = await updateStops(routeId, stopsData);

                if (saveResponse.success) {
                    navigate('/');
                    toast.success('Route and stops updated successfully!');
                } else {
                    throw new Error('Failed to update stops');
                }
            } else {
                throw new Error('Failed to update route');
            }
        } catch (error) {
            console.error('Error updating route or stops:', error);
            toast.error('Something went wrong while updating.');
        } finally {
            setStops([]); 
            setSelectedLocation(null); 
            setStopName(''); 
            reset(); 
            dispatch(setProgress(100)); 
        }
    };



    return (
        <>
            <Navbar />
            <div className="max-h-[80vh]  text-white p-6">
                <div className=" mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                        >
                            <h2 className="text-xl font-semibold mb-6">Update Route</h2>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Route Name</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            {...register('name')}
                                            placeholder="Enter route name"
                                            className="flex-1 h-12 rounded-lg border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-white/20 focus:ring-white/20 p-4"
                                        />
                                        <button
                                            type="submit"
                                            disabled={stops.length < 2}
                                            className="px-6 h-12 bg-white text-black rounded-lg hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Update Route
                                        </button>
                                    </div>
                                    {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name.message}</p>}
                                </div>

                                {stops.length >= 2 && (
                                    <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div>
                                            <p className="text-sm text-white/60">Total Distance</p>
                                            <p className="text-2xl font-semibold mt-1">{totalDistance.toFixed(2)} km</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-white/60">Total Time</p>
                                            <p className="text-2xl font-semibold mt-1">{Math.round(totalTime)} min</p>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 max-h-[70vh] overflow-y-auto"
                        >

                            <h3 className="text-lg font-medium mb-4">Stops ({stops.length})</h3>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={stops} strategy={verticalListSortingStrategy}>
                                    <AnimatePresence>
                                        {stops.length > 0 ? (
                                            <ul className="space-y-3 max-h-[21rem] overflow-y-auto pr-2 custom-scrollbar">
                                                {stops.map((stop) => (
                                                    <SortableStop
                                                        key={stop.id}
                                                        stop={stop}
                                                        onRemove={handleRemoveStop}
                                                        onClick={(id) => setEditingStopId(id)}
                                                    />
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-center py-8 text-white/40">
                                                <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                                                <p>Click on the map to add stops</p>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </SortableContext>
                            </DndContext>
                        </motion.div>
                    </div>

                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                        >
                            <h2 className="text-xl font-semibold mb-6">Add Stops</h2>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-white/70 mb-2">Stop Name</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={stopName}
                                        onChange={(e) => setStopName(e.target.value)}
                                        placeholder="Enter stop name"
                                        className="flex-1 h-12 rounded-lg border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-white/20 focus:ring-white/20 p-4"
                                    />
                                    <button
                                        onClick={handleAddStop}
                                        disabled={!selectedLocation || !stopName}
                                        className="flex items-center px-6 h-12 bg-white text-black rounded-lg hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus size={18} className="mr-2" />
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="h-[520px] rounded-lg overflow-hidden border border-white/10">
                                <MapContainer
                                    center={[31.6340, 74.8723]}
                                    zoom={13}
                                    className="h-full w-full"
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapEvents onMapClick={handleMapClick} />
                                    {stops.length > 1 && <Polyline positions={routePolyline} color="blue" />}
                                    {selectedLocation && (
                                        <Marker
                                            position={selectedLocation}
                                            icon={defaultIcon}
                                        >
                                            <Popup>
                                                <div className="text-center">
                                                    <MapPin className="inline-block" size={18} />
                                                    <p className="font-medium">Selected Location</p>
                                                    <p className="text-sm text-gray-600">
                                                        {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                                                    </p>

                                                    <button
                                                        className="mt-1 text-xs text-red-500 hover:underline"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            setSelectedLocation(null);
                                                            setStopName('');
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )}
                                    {stops.map((stop, index) => (
                                        <Marker
                                            key={stop.id}
                                            position={[stop.latitude, stop.longitude]}
                                            icon={index === 0 ? startIcon : index === stops.length - 1 ? endIcon : defaultIcon}
                                        >
                                            <Popup>
                                                <div className="text-center">
                                                    <MapPin className="inline-block" size={18} />
                                                    <p className="font-medium">{stop.stopName}</p>
                                                    <p className="text-sm text-gray-600">Stop #{stop.stopOrder}</p>
                                                    {stop.distanceFromPrevious > 0 && (
                                                        <p className="text-sm text-gray-600">
                                                            Distance from previous: {stop.distanceFromPrevious.toFixed(2)} km
                                                        </p>
                                                    )}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}