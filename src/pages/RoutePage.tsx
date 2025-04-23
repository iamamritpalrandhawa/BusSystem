
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MapPin, Clock, Trash2, Pencil, Eye, Ruler } from 'lucide-react';
import Navbar from '@/components/Nabvar';
import { Button } from '@/components/ui/button';
import { Icon } from 'leaflet';
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setProgress } from '@/store/progressSlice';
import { toast } from 'sonner';
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RouteResponse, Stop } from '@/types';
import { fetchRouteData, deleteRouteData, fetchStops } from '@/api';
import { useNavigate } from 'react-router-dom';


import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';

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


function RoutePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [routeData, setRouteData] = useState<RouteResponse>({ success: true, count: 0, pageNO: 1, pages: 1, data: [] });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [routeIdToDelete, setRouteIdToDelete] = useState<string | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [stops, setStops] = useState<Stop[]>([]);
    const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

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

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const getData = async () => {
                dispatch(setProgress(30));
                const data = await fetchRouteData(currentPage, searchQuery);
                dispatch(setProgress(70));
                setRouteData(data);//duplicate issue
                dispatch(setProgress(100));
            };
            getData();
        }, 800);

        return () => clearTimeout(delayDebounce);
    }, [currentPage, dispatch, searchQuery]);



    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => setCurrentPage(page);

    const handleDelete = async (routeId: string) => {
        dispatch(setProgress(30));
        const data = await deleteRouteData(routeId);
        dispatch(setProgress(70));
        if (data.success) {
            setRouteData(prev => ({ ...prev, data: prev.data.filter(r => r.id !== routeId) }));
            toast.success("Route deleted successfully.");
        } else toast.error("Something went wrong.");
        dispatch(setProgress(100));
    };



    const renderPaginationItems = () => {
        const items = [];
        const totalPages = routeData.pages;
        const maxVisiblePages = 10;
        const startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
        const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
                </PaginationItem>
            );
        }
        return items;
    };

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


    function formatMinutesToHHMM(minutesStr: string): string {
        const totalMinutes = parseFloat(minutesStr);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);
        const seconds = Math.round((totalMinutes % 1) * 60);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function formatDistanceKm(km: number): string {
        return `${km.toFixed(2)} km`;
    }


    return (
        <>
            <Navbar />
            <div className="bg-background px-6 space-y-8">
                <div className="container mx-auto space-y-6">
                    {/* Search */}
                    <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
                        <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
                        <div className='flex items-center gap-4'>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search by route name..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-lg shadow-md transition-colors duration-200"
                                onClick={() => navigate('/route')}
                            >
                                + Create Route
                            </Button>

                        </div>
                    </div>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>Are you sure you want to delete this route?</DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-4">
                                <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => { if (routeIdToDelete) handleDelete(routeIdToDelete); setDeleteConfirmOpen(false); }}>Delete</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                        <DialogContent className="max-w-5xl">
                            <DialogHeader>
                                <DialogTitle>Route Map</DialogTitle>
                                <DialogDescription>Stop locations and path overview.</DialogDescription>
                            </DialogHeader>
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

                                    {stops.length > 1 && <Polyline positions={routePolyline} color="blue" />}


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
                        </DialogContent>
                    </Dialog>

                    <div className="rounded-lg border bg-card overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Start</TableHead>
                                    <TableHead>End</TableHead>
                                    <TableHead>Distance (km)</TableHead>
                                    <TableHead>Total Time</TableHead>
                                    <TableHead>View</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {routeData.data.map(route => (
                                    <TableRow key={route.id}>
                                        <TableCell>{route.name}</TableCell>
                                        <TableCell><MapPin className="inline w-4 h-4 mr-1 text-muted-foreground" />{route.startLocation}</TableCell>
                                        <TableCell><MapPin className="inline w-4 h-4 mr-1 text-muted-foreground" />{route.endLocation}</TableCell>
                                        <TableCell>
                                            <Ruler className="inline w-4 h-4 mr-1 text-muted-foreground" />
                                            {formatDistanceKm(route.distanceKm)}
                                        </TableCell>


                                        <TableCell>
                                            <Clock className="inline w-4 h-4 mr-1 text-muted-foreground" />
                                            {formatMinutesToHHMM(route.totalTime)}
                                        </TableCell>

                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Eye
                                                            className="w-4 h-4 cursor-pointer text-muted-foreground"
                                                            onClick={async () => {
                                                                const data: Stop[] = await fetchStops(route.id);
                                                                setStops(data);
                                                                setIsMapOpen(true);
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Pencil className="h-4 w-4 text-blue-500 cursor-pointer" onClick={() => {
                                                    navigate(`/route/${route.id}`)
                                                }} />
                                                <Trash2 className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => { setRouteIdToDelete(route.id); setDeleteConfirmOpen(true); }} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col items-center space-y-4 absolute bottom-2 w-[85%]">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} />
                                </PaginationItem>
                                {renderPaginationItems()}
                                {routeData.pages > 5 && <PaginationEllipsis />}
                                <PaginationItem>
                                    <PaginationNext onClick={() => currentPage < routeData.pages && handlePageChange(currentPage + 1)} className={currentPage === routeData.pages ? 'pointer-events-none opacity-50' : ''} />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {routeData.pages} • Total Routes: {routeData.count}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RoutePage;
