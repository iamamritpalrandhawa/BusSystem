import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Bus } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Navbar from '@/components/Nabvar';

const busSchema = z.object({
    number: z.string().min(1, 'Bus number is required'),
    model: z.string().min(1, 'Bus model is required'),
    capacity: z.string().transform(Number),
    routeId: z.string().min(1, 'Route is required'),
    status: z.enum(['active', 'maintenance', 'inactive']),
});

const BusesPage = () => {
    const [buses, setBuses] = useState<Bus[]>([
        {
            id: '1',
            number: '101',
            model: 'Volvo X20',
            capacity: 50,
            routeId: 'R1',
            status: 'active',
            schedules: [],
        },
        {
            id: '2',
            number: '202',
            model: 'Mercedes C300',
            capacity: 40,
            routeId: 'R2',
            status: 'maintenance',
            schedules: [],
        },
        {
            id: '3',
            number: '303',
            model: 'Scania P420',
            capacity: 45,
            routeId: 'R3',
            status: 'inactive',
            schedules: [],
        },
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBus, setEditingBus] = useState<Bus | null>(null);

    const form = useForm({
        resolver: zodResolver(busSchema),
        defaultValues: {
            number: '',
            model: '',
            capacity: '',
            routeId: '',
            status: 'active' as const,
        },
    });

    const onSubmit = (data: z.infer<typeof busSchema>) => {
        if (editingBus) {
            setBuses((prev) =>
                prev.map((bus) =>
                    bus.id === editingBus.id ? { ...bus, ...data } : bus
                )
            );
        } else {
            const newBus: Bus = {
                id: crypto.randomUUID(),
                ...data,
                schedules: [],
            };
            setBuses((prev) => [...prev, newBus]);
        }
        setIsModalOpen(false);
        form.reset();
        setEditingBus(null);
    };

    return (<>
        <Navbar />
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Buses</h1>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Add Bus</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingBus ? 'Edit Bus' : 'Add New Bus'}
                            </DialogTitle>
                            <DialogDescription>
                                Fill in the details below to{' '}
                                {editingBus ? 'update' : 'add'} a bus to the
                                system.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="number">Bus Number</Label>
                                    <Input
                                        id="number"
                                        {...form.register('number')}
                                        placeholder="Enter bus number"
                                    />
                                    {form.formState.errors.number && (
                                        <p className="text-sm text-red-500">
                                            {
                                                form.formState.errors.number
                                                    .message
                                            }
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        {...form.register('model')}
                                        placeholder="Enter bus model"
                                    />
                                    {form.formState.errors.model && (
                                        <p className="text-sm text-red-500">
                                            {
                                                form.formState.errors.model
                                                    .message
                                            }
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        {...form.register('capacity')}
                                        placeholder="Enter capacity"
                                    />
                                    {form.formState.errors.capacity && (
                                        <p className="text-sm text-red-500">
                                            {
                                                form.formState.errors.capacity
                                                    .message
                                            }
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="routeId">Route</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            form.setValue('routeId', value)
                                        }
                                        defaultValue={form.getValues('routeId')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a route" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="R1">
                                                City Center - Airport
                                            </SelectItem>
                                            <SelectItem value="R2">
                                                Downtown - Mall
                                            </SelectItem>
                                            <SelectItem value="R3">
                                                University - Stadium
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            form.setValue(
                                                'status',
                                                value as Bus['status']
                                            )
                                        }
                                        defaultValue={form.getValues('status')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="maintenance">
                                                Maintenance
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">
                                    {editingBus ? 'Update Bus' : 'Add Bus'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table for displaying buses */}
            <div className="mt-6">
                <table className="w-full border-collapse border ">
                    <thead>
                        <tr className="">
                            <th className="border p-2">Number</th>
                            <th className="border p-2">Model</th>
                            <th className="border p-2">Capacity</th>
                            <th className="border p-2">Route</th>
                            <th className="border p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buses.map((bus) => (
                            <tr key={bus.id} className="text-center">
                                <td className="border p-2">{bus.number}</td>
                                <td className="border p-2">{bus.model}</td>
                                <td className="border p-2">{bus.capacity}</td>
                                <td className="border p-2">{bus.routeId}</td>
                                <td className="border p-2">{bus.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </>
    );
};

export default BusesPage;
