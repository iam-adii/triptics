import { Hotel, RoomRate, HotelWithRates } from "@/types/hotel";

// Fetch all hotels
export declare function fetchHotels(): Promise<Hotel[]>;

// Fetch a single hotel with its room rates
export declare function fetchHotelWithRates(id: string): Promise<HotelWithRates | null>;

// Create a new hotel
export declare function createHotel(hotel: Omit<Hotel, "id" | "created_at" | "updated_at">): Promise<Hotel>;

// Update an existing hotel
export declare function updateHotel(id: string, hotel: Partial<Hotel>): Promise<Hotel>;

// Delete a hotel
export declare function deleteHotel(id: string): Promise<void>;

// Create a new room rate
export declare function createRoomRate(roomRate: Omit<RoomRate, "id" | "created_at" | "updated_at">): Promise<RoomRate>;

// Update an existing room rate
export declare function updateRoomRate(id: string, roomRate: Partial<RoomRate>): Promise<RoomRate>;

// Delete a room rate
export declare function deleteRoomRate(id: string): Promise<void>; 