import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import { LatLng, Icon, } from 'leaflet';
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
import { fetchStops, updateRoute, updateStops } from '@/api';
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
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

function estimateTravelTime(distance: number): number {
    const averageSpeed = 35; // Average speed in km/h
    return (distance / averageSpeed) * 60; // Time in minutes
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
            className="flex items-center justify-between p-4 rounded-lg shadow-md border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <div {...attributes} {...listeners} className="cursor-move">
                        <div className="w-6 h-6 flex items-center justify-center">⋮⋮</div>
                    </div>
                    <span className="font-medium text-white">{stop.stopName}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-white">
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
            <button
                onClick={() => onClick(stop.id)} // Handle onClick event
                className="ml-2 p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
            >
                <Edit size={18} />
            </button>

            <button
                onClick={() => onRemove(stop.id)}
                className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
            >
                <Trash2 size={18} />
            </button>
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

            const route = await fetchStops(routeId);

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
            setEditingStopId(null); // Reset editing state after saving changes
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

            // Use a functional update to avoid closures
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
        // Step 1: Validate that at least two stops are present
        if (stops.length < 2) {
            toast.error('Please add at least two stops to update the route');
            return;
        }

        // Step 2: Prepare the route data
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
            // Step 3: Update the route using PUT request
            const routeResponse = await updateRoute(routeId, routeData);

            if (routeResponse.success) {
                // Step 4: Prepare stops data
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

                // Step 5: Update the stops using PUT request
                const saveResponse = await updateStops(routeId, stopsData);

                if (saveResponse.success) {
                    // On success, navigate and show success toast
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
            // Step 6: Reset states after the operation
            setStops([]); // Clear stops array
            setSelectedLocation(null); // Clear selected location
            setStopName(''); // Reset stop name
            reset(); // Reset the form
            dispatch(setProgress(100)); // Update progress to 100%
        }
    };



    return (
        <>
            <Navbar />
            <div className="grid grid-cols-1 lg:grid-cols-2 px-6">
                <div >
                    <div className=" pt-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-6">Update Route</h2>
                        <label className="block text-sm font-medium text-gray-700">Route Name</label>
                        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center space-x-2 w-full">
                            <input
                                type="text"
                                {...register('name')}
                                placeholder="Enter route name"
                                className=" mt-2 flex-grow h-12 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-3 text-black"
                            />
                            <button
                                type="submit"
                                disabled={stops.length < 2}
                                className="mt-2 h-12 rounded-md bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors px-5"
                            >
                                Update Route
                            </button>
                        </form>
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}

                        {stops.length >= 2 && (
                            <div className="p-4 rounded-md">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Distance</p>
                                        <p className="text-lg font-semibold">{totalDistance.toFixed(2)} km</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Time</p>
                                        <p className="text-lg font-semibold">{Math.round(totalTime)} min</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className=" pb-6 pt-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-medium mb-4 text-gray-100">Stops ({stops.length})</h3>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={stops} strategy={verticalListSortingStrategy}>
                                <AnimatePresence>
                                    <ul className="space-y-3 text-gray-100 max-h-[26rem] overflow-y-auto pr-2 custom-scrollbar">
                                        {stops.map((stop) => (
                                            <SortableStop
                                                key={stop.id}
                                                stop={stop}
                                                onRemove={handleRemoveStop}
                                                onClick={(id: string) => setEditingStopId(id)}
                                            />

                                        ))}
                                    </ul>
                                </AnimatePresence>
                            </SortableContext>
                        </DndContext>
                    </div>

                </div>

                <div className="space-y-6">
                    <div className=" pl-6 py-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-6">Add Stops</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Stop Name</label>
                            <div className="mt-2 flex space-x-2">
                                <input
                                    type="text"
                                    value={stopName}
                                    onChange={(e) => setStopName(e.target.value)}
                                    placeholder="Enter stop name"
                                    className="block w-full h-12 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 px-3 text-black placeholder-gray-400"
                                />
                                <button
                                    onClick={handleAddStop}
                                    disabled={!selectedLocation || !stopName}
                                    className="flex items-center px-3 h-11 bg-gray-800 rounded-md  disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Plus size={18} className="mr-1" />
                                    Add
                                </button>
                            </div>
                        </div>


                        <div className="h-[550px] rounded-lg overflow-hidden border border-gray-200 z-0 relative">
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
                                    <Marker position={selectedLocation} icon={defaultIcon}>
                                        <Popup>
                                            <div className="text-center space-y-1" style={{ minWidth: '120px', padding: '4px' }}>
                                                <MapPin className="inline-block text-primary mb-1" size={14} />
                                                <p className="font-medium text-sm">Selected Location</p>
                                                <p className="text-xs text-gray-600">
                                                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                                                </p>

                                                {/* Deselect button */}
                                                <button
                                                    className="mt-1 text-xs text-red-500 hover:underline"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // ⛔️ Prevent map click
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
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
}