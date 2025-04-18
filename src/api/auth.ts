import { Bus } from "@/types";
export const fetchUserData = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/me`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || "Failed to fetch user data");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

// services/studentService.ts

export const fetchStudentData = async (
  pageNo: number = 1,
  search: string = ""
) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }
    const response = await fetch(
      `https://bus-api.abhicracker.com/api/admin/users?page=${pageNo}&limit=10&search=${search}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    // ✅ Map API response to expected state shape
    return {
      success: data.success,
      count: data.count,
      pageNO: data.pagination.page,
      pages: data.pagination.totalPages,
      data: data.data.map(
        (student: {
          username: string;
          extra: {
            roll: string;
            course: string;
            address: string;
            phone: string;
            email: string;
          };
          name: string;
        }) => ({
          id: student.username,
          rollnumber: student.extra.roll,
          name: student.name,
          stream: student.extra.course,
          address: student.extra.address,
          mobileNo: student.extra.phone,
          email: student.extra.email,
        })
      ),
    };
  } catch (error) {
    console.error("Error fetching student data:", error);
    throw error;
  }
};

export const fetchBusData = async (pageNo: number = 1, search: string = "") => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }
    const response = await fetch(
      `https://bus-api.abhicracker.com/api/buses?page=${pageNo}&limit=10&search=${search}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    return {
      success: data.success,
      count: data.count,
      pageNO: data.pagination.page,
      pages: data.pagination.totalPages,
      data: data.data.map(
        (bus: {
          id: string;
          number: string;
          model: string;
          capacity: string;
          status: string;
        }) => ({
          id: bus.id,
          number: bus.number,
          model: bus.model,
          capacity: bus.capacity,
          status: bus.status,
        })
      ),
    };
  } catch (error) {
    console.error("Error fetching student data:", error);
    throw error;
  }
};

export const editBusData = async (data: Bus) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }
    const { id, ...dataWithoutId } = data;

    const response = await fetch(
      `https://bus-api.abhicracker.com/api/buses/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(dataWithoutId),
      }
    );

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Error editing bus data:", error);
    throw error;
  }
};

export const deleteBusData = async (id: string) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }
    const response = await fetch(
      `https://bus-api.abhicracker.com/api/buses/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Error deleting bus data:", error);
    throw error;
  }
};

// src/api/routeApi.ts

export const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found");
  }
  return token;
};

export const createRoute = async (data: {
  name: string;
  startLocation: string;
  endLocation: string;
  distanceKm: number;
  totalTime: string;
}) => {
  const token = getToken();

  const response = await fetch("https://bus-api.abhicracker.com/api/routes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  return responseData;
};

export const saveStops = async (
  routeId: string, // The routeId for the specific route
  stops: Array<{
    stopName: string;
    latitude: number;
    longitude: number;
    stopOrder: number;
    distanceFromPrevious: number;
    estimatedTime: number;
  }>
) => {
  const token = getToken(); // Retrieve token for authorization

  try {
    // Send POST request to add stops to a specific route
    const response = await fetch(
      `https://bus-api.abhicracker.com/api/routes/${routeId}/stops`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(stops),
      }
    );

    const responseData = await response.json();

    return responseData;
  } catch (error) {
    console.error("Error saving stops:", error);
  }
};
