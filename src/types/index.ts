export interface Route {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  stops: string[];
  distance: number;
  estimatedDuration: number;
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
