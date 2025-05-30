// Simplified types for our mock implementation
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Define basic interfaces for our data models
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
  name?: string;
}

export interface Customer {
  id: string;
  created_at: string;
  updated_at?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface Lead {
  id: string;
  created_at: string;
  updated_at?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  source?: string;
  status: string;
  notes?: string;
}

export interface Itinerary {
  id: string;
  created_at: string;
  updated_at?: string;
  title: string;
  description?: string;
  customer_id?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  total_price?: number;
}

export interface Booking {
  id: string;
  created_at: string;
  updated_at?: string;
  itinerary_id: string;
  customer_id: string;
  booking_date: string;
  status: string;
  total_amount: number;
  payment_status: string;
}

export interface Payment {
  id: string;
  created_at: string;
  updated_at?: string;
  booking_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  notes?: string;
}

export interface Hotel {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  address: string;
  city: string;
  country: string;
  star_rating?: number;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
}

export interface Transfer {
  id: string;
  created_at: string;
  updated_at?: string;
  booking_id?: string;
  customer_id?: string;
  date: string;
  pickup_location: string;
  dropoff_location: string;
  vehicle_type: string;
  status: string;
  price: number;
}

export interface CompanySettings {
  id: string;
  name: string;
  website?: string;
  address?: string;
  country?: string;
  timezone?: string;
  logo_url?: string;
  created_at: string;
  updated_at?: string;
}

// Mock Database type definition
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User>;
        Update: Partial<User>;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Customer>;
        Update: Partial<Customer>;
      };
      leads: {
        Row: Lead;
        Insert: Partial<Lead>;
        Update: Partial<Lead>;
      };
      itineraries: {
        Row: Itinerary;
        Insert: Partial<Itinerary>;
        Update: Partial<Itinerary>;
      };
      bookings: {
        Row: Booking;
        Insert: Partial<Booking>;
        Update: Partial<Booking>;
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment>;
        Update: Partial<Payment>;
      };
      hotels: {
        Row: Hotel;
        Insert: Partial<Hotel>;
        Update: Partial<Hotel>;
      };
      transfers: {
        Row: Transfer;
        Insert: Partial<Transfer>;
        Update: Partial<Transfer>;
      };
      company_settings: {
        Row: CompanySettings;
        Insert: Partial<CompanySettings>;
        Update: Partial<CompanySettings>;
      };
    };
  };
};
