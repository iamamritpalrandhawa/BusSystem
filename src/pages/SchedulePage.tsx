import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Search, Clock, Trash2, Pencil, Eye, Timer, Bus, MapPin } from 'lucide-react';

import Navbar from '@/components/Nabvar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setProgress } from '@/store/progressSlice';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ScheduleItem, ScheduleResponse } from '@/types';
import { fetchScheduleData, deleteScheduleData } from '@/api';

function SchedulePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [scheduleData, setScheduleData] = useState<ScheduleResponse>({ success: true, count: 0, pageNO: 1, pages: 1, data: [] });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [scheduleIdToDelete, setScheduleIdToDelete] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<ScheduleItem>();

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const getData = async () => {
                dispatch(setProgress(30));
                const data = await fetchScheduleData(currentPage, searchQuery);
                dispatch(setProgress(70));
                setScheduleData(data);
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

    const handleDelete = async (id: string) => {
        dispatch(setProgress(30));
        const data = await deleteScheduleData(id);
        dispatch(setProgress(70));
        if (data.success) {
            setScheduleData(prev => ({ ...prev, data: prev.data.filter(s => s.id !== id) }));
            toast.success("Schedule deleted successfully.");
        } else toast.error("Something went wrong.");
        dispatch(setProgress(100));
    };

    const renderPaginationItems = () => {
        const items = [];
        const totalPages = scheduleData.pages;
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
    const getDuration = (start: string, end: string) => {
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diffMs = endTime.getTime() - startTime.getTime();
        const minutes = Math.floor((diffMs / 1000 / 60) % 60);
        const hours = Math.floor(diffMs / 1000 / 60 / 60);
        return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    };



    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Navbar />
            <div className="bg-background px-6 space-y-8">
                <div className="container mx-auto space-y-6">
                    <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
                        <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
                        <div className='flex items-center gap-4'>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search by route name or bus number..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-lg shadow-md transition-colors duration-200"
                                onClick={() => navigate('/schedule')}
                            >
                                + Create Schedule
                            </Button>
                        </div>
                    </div>

                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>Are you sure you want to delete this schedule?</DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-4">
                                <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => { if (scheduleIdToDelete) handleDelete(scheduleIdToDelete); setDeleteConfirmOpen(false); }}>Delete</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                        <DialogContent className="max-h-[86vh]">
                            <DialogHeader>
                                <DialogTitle>Schedule Preview</DialogTitle>
                                <DialogDescription>View full schedule details</DialogDescription>
                            </DialogHeader>

                            {previewData && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-medium">Bus</h3>
                                        <p className="text-gray-600">{previewData.bus.number} - {previewData.bus.model}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-medium">Route</h3>
                                        <p className="text-gray-600">{previewData.route.name}</p>
                                        <p className="text-sm text-gray-500">{previewData.route.startLocation} → {previewData.route.endLocation}</p>
                                    </div>

                                    {previewData.stops && previewData.stops.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="font-medium">Stops</h3>
                                            {/* Add ScrollArea for stops list */}
                                            <ScrollArea className="h-[100px] overflow-y-auto">
                                                <ul className="text-gray-600 space-y-1">
                                                    {previewData.stops
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((stop) => (
                                                            <li key={stop.id} className="space-y-1">
                                                                <div className="font-medium">{stop.stopName}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    <Timer className="inline w-4 h-4 text-muted-foreground" /> Start: {formatTime(stop.startTime)} | End: {formatTime(stop.endTime)}
                                                                </div>
                                                            </li>
                                                        ))}
                                                </ul>
                                            </ScrollArea>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h3 className="font-medium">Time</h3>
                                        <p className="text-gray-600">Start: {formatTime(previewData.startTime)}</p>
                                        <p className="text-gray-600">End: {formatTime(previewData.endTime)}</p>
                                        <p className="text-sm text-gray-500">
                                            <Timer className="inline w-4 h-4 text-muted-foreground" /> Duration: {getDuration(previewData.startTime, previewData.endTime)}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-medium">Type</h3>
                                        <p className="text-gray-600">
                                            {previewData.isOneTime ? 'One-time schedule' : 'Repeating schedule'}
                                        </p>
                                        {!previewData.isOneTime && previewData.repeatDays.length > 0 && (
                                            <p className="text-sm text-gray-500">Repeats on: {previewData.repeatDays.join(', ')}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end ">
                                        <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>





                    <div className="rounded-lg border bg-card overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Bus</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Repeat</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scheduleData.data.map((schedule: ScheduleItem) => (
                                    <TableRow key={schedule.id}>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <MapPin className="mr-2 text-gray-500" />
                                                {schedule.route.name}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center">
                                                <Bus className="mr-2 text-gray-500" />
                                                {schedule.bus.number} ({schedule.bus.model})
                                            </div>
                                        </TableCell>
                                        <TableCell><Clock className="inline w-4 h-4 mr-1 text-muted-foreground" />{formatTime(schedule.startTime)}</TableCell>
                                        <TableCell><Clock className="inline w-4 h-4 mr-1 text-muted-foreground" />{formatTime(schedule.endTime)}</TableCell>
                                        <TableCell>
                                            <Timer className="inline    w-4 h-4 text-muted-foreground" /> {getDuration(schedule.startTime, schedule.endTime)}
                                        </TableCell>
                                        <TableCell>{schedule.isOneTime ? 'One-time' : schedule.repeatDays.join(', ')}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Eye className="h-4 w-4 text-green-500 cursor-pointer" onClick={() => {
                                                    setPreviewData(schedule);
                                                    setIsPreviewOpen(true);
                                                }} />
                                                <Pencil className="h-4 w-4 text-blue-500 cursor-pointer" onClick={() => navigate(`/schedule/${schedule.id}`)} />
                                                <Trash2 className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => { setScheduleIdToDelete(schedule.id); setDeleteConfirmOpen(true); }} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col items-center space-y-4 absolute bottom-2 w-[85%]">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} />
                                </PaginationItem>
                                {renderPaginationItems()}
                                {scheduleData.pages > 5 && <PaginationEllipsis />}
                                <PaginationItem>
                                    <PaginationNext onClick={() => currentPage < scheduleData.pages && handlePageChange(currentPage + 1)} className={currentPage === scheduleData.pages ? 'pointer-events-none opacity-50' : ''} />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {scheduleData.pages} • Total Routes: {scheduleData.count}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SchedulePage;