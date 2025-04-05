export interface Route {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  stops: string[];
  distance: number;
  estimatedDuration: number;
}

export interface Bus {
  id: string;
  number: string;
  capacity: number;
  model: string;
  routeId: string;
  status: "active" | "maintenance" | "inactive";
  schedules: BusSchedule[];
}

export interface BusSchedule {
  id: string;
  departureTime: string;
  arrivalTime: string;
  routeId: string;
  busId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator";
  lastLogin?: string;
}
