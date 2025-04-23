
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Clock, MapPin, CalendarRange, Route as RouteIcon,
    Bus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    createSchedule,
    fetchBuses, fetchRoute, fetchRoutes,
} from '@/api';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import Navbar from '@/components/Nabvar';
import { Bus as BusType, Route } from '@/types';
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setProgress } from "@/store/progressSlice";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';



const convertToDate = (timeString: string): Date => {
    // Assume '1970-01-01' as a dummy date to avoid invalid Date issues
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date('1970-01-01T00:00:00Z');
    date.setHours(hour);
    date.setMinutes(minute);
    return date;
};


const scheduleSchema = z.object({
    busId: z.string().min(1, 'Please select a bus'),
    routeId: z.string().min(1, 'Please select a route'),
    stops: z
        .array(
            z.object({
                stopId: z.string(),
                startTime: z.string().min(1, 'Select arrival'),
                endTime: z.string().min(1, 'Select departure'),
            })
        )
        .superRefine((stops, ctx) => {
            stops.forEach((stop, i) => {
                const startTime = convertToDate(stop.startTime);
                const endTime = convertToDate(stop.endTime);
                const startedPM = startTime.getHours() >= 12;
                const endedAM = endTime.getHours() < 12;
                if (startedPM && endedAM) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Cannot cross midnight – end time must be later on the same day`,
                        path: [i, 'endTime'],
                    });
                    return; // skip any further checks for this stop
                }

                // 1) Same-stop validation
                if (endTime <= startTime) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Departure must be after arrival`,
                        path: [i, 'endTime'],
                    });
                }

                // 2) Chaining: next-start > this-end
                if (i < stops.length - 1) {
                    const next = stops[i + 1];
                    const nextStartTime = convertToDate(next.startTime);

                    // Check if the next stop's start time is after the current stop's end time
                    if (nextStartTime <= endTime) {
                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `Next arrival must be after previous departure`,
                            path: [i + 1, 'startTime'],
                        });
                    }
                }
            });
        }),
    repeatDays: z
        .array(z.enum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']))
        .optional(),
    isOneTime: z.boolean(),
});




type ScheduleFormData = z.infer<typeof scheduleSchema>;

export function CreateSchedule() {
    const [buses, setBuses] = useState<BusType[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { register, handleSubmit, watch, setValue,
        // reset,
        formState: { errors } } = useForm<ScheduleFormData>({
            resolver: zodResolver(scheduleSchema),
            defaultValues: {
                stops: [],
                repeatDays: [],
                isOneTime: false,
            },
        });

    const selectedRouteId = watch('routeId');
    const selectedBusId = watch('busId');
    // const isOneTime = watch('isOneTime');


    useEffect(() => {
        async function loadData() {
            try {
                dispatch(setProgress(20));

                const [busesData, routesData] = await Promise.all([
                    fetchBuses().then(data => {
                        dispatch(setProgress(50));
                        return data;
                    }),
                    fetchRoutes()
                ]);

                setBuses(busesData);
                setRoutes(routesData);

                dispatch(setProgress(100));
            } catch (err) {
                console.debug(err)
                toast.error("Failed to load data. Please try again.");
                dispatch(setProgress(100));
            } finally {
                setTimeout(() => dispatch(setProgress(0)), 500);
            }
        }

        loadData();
    }, []);

    useEffect(() => {
        const fetchAndSetRoute = async () => {
            if (selectedRouteId) {
                try {
                    const route: Route = await fetchRoute(selectedRouteId);
                    setSelectedRoute(route || null);

                    if (route) {
                        const initialStops = route.stops.map(stop => ({
                            stopId: stop.id,
                            startTime: '',
                            endTime: '',
                        }));
                        setValue('stops', initialStops);
                    }
                } catch (error) {
                    console.error("Error fetching route:", error);
                }
            }
        };
        fetchAndSetRoute();
    }, [selectedRouteId, setValue]);


    const onSubmit = async (data: ScheduleFormData) => {
        if (!data.stops.length) {
            toast.error("Please add at least one stop.");
            return;
        }
        if (!data.isOneTime && (!data.repeatDays || data.repeatDays.length === 0)) {
            toast.error("Please select at least one day for a repeating schedule.");
            return;
        }

        try {
            dispatch(setProgress(30)); // Start progress

            const stopsWithISO = data.stops.map((s) => {
                const isoStart = new Date(`1970-01-01T${s.startTime}:00Z`).toISOString();
                const isoEnd = new Date(`1970-01-01T${s.endTime}:00Z`).toISOString();
                return {
                    ...s,
                    startTime: isoStart,
                    endTime: isoEnd,
                };
            });

            const finalPayload = {
                ...data,
                stops: stopsWithISO,
                startTime: stopsWithISO[0].startTime,
                endTime: stopsWithISO[stopsWithISO.length - 1].endTime,
            };

            dispatch(setProgress(60));

            const result = await createSchedule(finalPayload);

            if (result.success) {
                dispatch(setProgress(100));
                navigate('/schedules')
                toast.success("Schedule successfully created!");
            } else {
                dispatch(setProgress(100));
                toast.error(`something went wrong.`);
            }
        } catch (error) {
            dispatch(setProgress(100));
            toast.error("An unexpected error occurred.");
            console.error(error);
        } finally {
            setTimeout(() => dispatch(setProgress(0)), 500);
        }
    };
    return (<>
        <Navbar />
        <div className="min-h-[70vh]  text-white p-6">
            <div className="max-w-[90vw] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-left"
                >
                    <h1 className="text-4xl font-bold mb-4">Schedule </h1>
                </motion.div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                            >

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Bus className="text-white" size={20} />
                                    </div>
                                    <h2 className="text-xl font-semibold">Select Vehicle</h2>
                                </div>

                                <Select
                                    onValueChange={(value) => setValue('busId', value)}
                                    defaultValue={selectedBusId}
                                >
                                    <SelectTrigger className="w-full bg-white/5 border border-white/10 text-white rounded-lg">
                                        <SelectValue placeholder="Choose a bus..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black text-white border border-white/10 rounded-lg">
                                        {buses.map((bus) => (
                                            <SelectItem
                                                key={bus.id}
                                                value={bus.id}
                                                className="hover:bg-white/10 cursor-pointer"
                                            >
                                                {bus.number} - {bus.model} ({bus.capacity} seats)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.busId && (
                                    <p className="text-red-400 text-sm mt-2">{errors.busId.message}</p>
                                )}

                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <RouteIcon className="text-white" size={20} />
                                    </div>
                                    <h2 className="text-xl font-semibold">Select Route</h2>
                                </div>

                                <Select
                                    onValueChange={(value) => setValue('routeId', value)}
                                    defaultValue={selectedRouteId}
                                >
                                    <SelectTrigger className="w-full bg-white/5 border border-white/10 text-white rounded-lg">
                                        <SelectValue placeholder="Choose a route..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black text-white border border-white/10 rounded-lg">
                                        {routes.map((route) => (
                                            <SelectItem
                                                key={route.id}
                                                value={route.id}
                                                className="hover:bg-white/10 cursor-pointer"
                                            >
                                                {route.name} ({route.startLocation} → {route.endLocation})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.routeId && (
                                    <p className="text-red-400 text-sm mt-2">{errors.routeId.message}</p>
                                )}

                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <CalendarRange className="text-white" size={20} />
                                    </div>
                                    <h2 className="text-xl font-semibold">Schedule Type</h2>
                                </div>
                                <div className="space-y-4">
                                    {/* {!isOneTime && ( */}
                                    <div className="grid grid-cols-7 gap-2">
                                        {(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map(day => {
                                            const selectedDays = watch('repeatDays') || [];
                                            const isSelected = selectedDays.includes(day);

                                            return (
                                                <label
                                                    key={day}
                                                    className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors
            ${isSelected ? 'bg-white/20 text-white font-medium' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        value={day}
                                                        {...register('repeatDays')}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-sm">{day}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {/* )} */}

                                    {/* <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            {...register('isOneTime')}
                                            className="rounded border-white/10 bg-white/5 text-white focus:ring-white/20"
                                        />
                                        <span>One-time schedule</span>
                                    </label> */}



                                </div>
                            </motion.div>
                        </div>

                        <AnimatePresence mode="wait">
                            {selectedRoute ? (
                                <motion.div
                                    key="stops"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <Clock className="text-white" size={20} />
                                        </div>
                                        <h2 className="text-xl font-semibold">Stop Schedule</h2>
                                    </div>
                                    <div className="space-y-4 max-h-[52vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                        {selectedRoute?.stops?.map((stop, index) => (
                                            <motion.div
                                                key={stop.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white/5 p-4 rounded-lg border border-white/10"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    <span className="font-medium">{stop.stopName}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm text-gray-400 mb-1">Arrival</label>
                                                        <input
                                                            type="time"
                                                            {...register(`stops.${index}.startTime`)}
                                                            className=" cursor-pointer w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
                                                            onClick={(e) => {
                                                                if (e.currentTarget.showPicker) {
                                                                    e.currentTarget.showPicker();
                                                                }
                                                            }} />
                                                        {errors.stops?.[index]?.startTime && (
                                                            <p className="text-red-400 text-sm mt-1">{errors.stops[index].startTime?.message}</p>
                                                        )}

                                                    </div>

                                                    <div>
                                                        <label className="block text-sm text-gray-400 mb-1">Departure</label>
                                                        <input
                                                            type="time"
                                                            {...register(`stops.${index}.endTime`)}
                                                            className="cursor-pointer w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
                                                            onClick={(e) => {
                                                                if (e.currentTarget.showPicker) {
                                                                    e.currentTarget.showPicker();
                                                                }
                                                            }}
                                                        />
                                                        {errors.stops?.[index]?.endTime && (
                                                            <p className="text-red-400 text-sm mt-1">{errors.stops[index].endTime?.message}</p>
                                                        )}

                                                    </div>
                                                    <input
                                                        type="hidden"
                                                        {...register(`stops.${index}.stopId`)}
                                                        value={stop.id}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 flex items-center justify-center"
                                >
                                    <div className="text-center text-gray-400">
                                        <RouteIcon size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Select a route to view and schedule stops</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-white text-black rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-white/50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                        >
                            Create Schedule
                        </button>
                    </div>

                </form>
            </div>
        </div>
    </>

    );
}