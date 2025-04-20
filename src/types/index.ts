export interface BusSchedule {
  id: string;
  departureTime: string;
  arrivalTime: string;
  routeId: string;
  busId: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface Student {
  id: string;
  rollnumber: string;
  name: string;
  stream: string;
  address: string;
  mobileNo: string;
  email: string;
}

export interface StudentResponse {
  success: boolean;
  count: number;
  pageNO: number;
  pages: number;
  data: Student[];
}

export type Bus = {
  id: string;
  number: string;
  capacity: number;
  model: string;
  status: string;
};

export type BusResponse = {
  success: boolean;
  count: number;
  pageNO: number;
  pages: number;
  data: Bus[];
};

export interface Stop {
  id: string;
  routeId: string;
  stopName: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  distanceFromPrevious: number;
  estimatedTime: number;
}

export interface Count {
  stops: number;
  buses: number;
  schedules: number;
}

export interface Route {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  distanceKm: number;
  totalTime: string;
  stops: Stop[];
  _count: Count;
}

export type RouteResponse = {
  success: boolean;
  count: number;
  pageNO: number;
  pages: number;
  data: Route[];
};
