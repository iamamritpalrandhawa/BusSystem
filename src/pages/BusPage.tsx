import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, BusFront, Gauge, Wrench, CheckCircle, Trash2, Pencil } from 'lucide-react';
import Navbar from '@/components/Nabvar';
import { BusResponse, Bus } from '@/types';
import { fetchBusData, editBusData, deleteBusData } from '@/api';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setProgress } from '@/store/progressSlice';
import { toast } from 'sonner';

function BusPage1() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [busData, setBusData] = useState<BusResponse>({ success: true, count: 0, pageNO: 1, pages: 1, data: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [busIdToDelete, setBusIdToDelete] = useState<string | null>(null);

    const [editingBus, setEditingBus] = useState<Bus | null>(null);
    const dispatch = useDispatch<AppDispatch>();

    const form = useForm({
        defaultValues: {
            id: '',
            number: '',
            model: '',
            capacity: 0,
            status: ''
        }
    });

    useEffect(() => {
        const getData = async () => {
            try {
                dispatch(setProgress(30));
                const data = await fetchBusData(currentPage, searchQuery);
                dispatch(setProgress(70));
                setBusData(data);
                dispatch(setProgress(100));
            } catch (error) {
                dispatch(setProgress(100));
                console.error(error);
            }
        };
        getData();
    }, [currentPage, searchQuery]);

    useEffect(() => {
        if (editingBus) {
            form.reset({
                id: editingBus.id,
                number: editingBus.number,
                model: editingBus.model,
                capacity: editingBus.capacity,
                status: editingBus.status.toUpperCase()
            });
        } else {
            form.reset({
                id: '',
                number: '',
                model: '',
                capacity: 0,
                status: '',
            });
        }
    }, [editingBus, form]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleDelete = async (busId: string) => {
        try {
            dispatch(setProgress(30));
            const data = await deleteBusData(busId);
            dispatch(setProgress(70));
            if (data.success) {
                setBusData(prevState => ({
                    ...prevState,
                    data: prevState.data.filter(bus => bus.id !== busId)
                }));
                toast.success('Bus deleted successfully.')
            } else {
                toast.error('Something went wrong.')
            }
            dispatch(setProgress(100));
        } catch (error) {
            dispatch(setProgress(100));
            console.error(error);
        }
    };

    const handleUpdate = (bus: Bus) => {
        setEditingBus(bus);
        setIsModalOpen(true);
    };

    const onSubmit = async (data: { id: string; number: string; model: string; capacity: number; status: string }) => {
        try {
            dispatch(setProgress(30));
            const value = await editBusData(data);
            console.log("🚀 ~ onSubmit ~ value:", value)
            if (value.success) {
                setBusData(prevState => ({
                    ...prevState,
                    data: prevState.data.map(bus =>
                        bus.id === value.data.id ? { ...bus, ...value.data } : bus
                    )
                }));
                toast.success('Bus updated successfully.')
            } else {
                toast.error('Something went wrong.')
            }
            dispatch(setProgress(100));
        } catch (error) {
            dispatch(setProgress(100));
            console.error(error);
        }

        setIsModalOpen(false);
        setEditingBus(null);
        form.reset();
    };

    // Function to render pagination items
    const renderPaginationItems = () => {
        const items = [];
        const totalPages = busData.pages;
        const maxVisiblePages = 10;
        let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
        let endPage = startPage + maxVisiblePages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - maxVisiblePages + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        return items;
    };

    return (
        <>
            <Navbar />
            <div className="bg-background px-6 space-y-8">
                <div className="container mx-auto space-y-6">
                    <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
                        <h1 className="text-3xl font-bold tracking-tight">Buses</h1>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search by bus number or model..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) setEditingBus(null); }}>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingBus ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below to {editingBus ? 'update' : 'add'} a bus to the system.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="number">Bus Number</Label>
                                        <Input id="number" {...form.register('number')} placeholder="Enter bus number" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="model">Model</Label>
                                        <Input id="model" {...form.register('model')} placeholder="Enter bus model" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="capacity">Capacity</Label>
                                        <Input id="capacity" type="number" {...form.register('capacity', { valueAsNumber: true })} placeholder="Enter capacity" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            onValueChange={(value) => form.setValue('status', value)}
                                            defaultValue={form.getValues('status')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">{'Update Bus'}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={deleteConfirmOpen} onOpenChange={(open) => setDeleteConfirmOpen(open)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Deletion</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this bus? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-end gap-4">
                                <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (busIdToDelete) {
                                            handleDelete(busIdToDelete);
                                            setDeleteConfirmOpen(false);
                                            setBusIdToDelete(null);
                                        }
                                    }}
                                >
                                    Yes, Delete
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>


                    <div className="rounded-lg border bg-card overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {busData.data.map((bus) => (
                                    <TableRow key={bus.number}>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <BusFront className="h-4 w-4 text-muted-foreground" />
                                                <span>{bus.number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Gauge className="h-4 w-4 text-muted-foreground" />
                                                <span>{bus.capacity}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Wrench className="h-4 w-4 text-muted-foreground" />
                                                <span>{bus.model}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className={`h-4 w-4 ${bus.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`} />
                                                <span>{bus.status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Pencil
                                                    className="h-4 w-4 text-blue-500 cursor-pointer"
                                                    onClick={() => handleUpdate(bus)}
                                                />
                                                <Trash2
                                                    className="h-4 w-4 text-red-500 cursor-pointer"
                                                    onClick={() => {
                                                        setBusIdToDelete(bus.id);
                                                        setDeleteConfirmOpen(true);
                                                    }}
                                                />

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
                                    <PaginationPrevious
                                        onClick={(e) => {
                                            if (currentPage === 1) { e.preventDefault(); return; }
                                            handlePageChange(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                {renderPaginationItems()}
                                {busData.pages > 5 && <PaginationEllipsis />}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={(e) => {
                                            if (currentPage === busData.pages) { e.preventDefault(); return; }
                                            handlePageChange(currentPage + 1);
                                        }}
                                        className={currentPage === busData.pages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                        <div className="text-sm text-muted-foreground">
                            Page {currentPage} of {busData.pages} • Total Buses: {busData.count}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default BusPage1;
