import { z } from 'zod';
import { AppError } from '../utils/errors.js';

// Helper to create validation middleware
export function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const data = await schema.parseAsync(req[source]);
      // Replace the original data with validated/transformed data
      req[source] = data;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new AppError(`Validation error: ${messages}`, 400));
      }
      next(err);
    }
  };
}

// Common validation schemas
export const schemas = {
  // Auth schemas
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().optional(),
    driver_license_number: z.string().optional(),
    address: z.string().optional(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  }),

  updateProfile: z.object({
    full_name: z.string().min(2).optional(),
    phone: z.string().optional(),
    driver_license_number: z.string().optional(),
    address: z.string().optional(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    password: z.string().min(8).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),

  // Vehicle search schemas
  vehicleSearch: z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']).optional(),
    transmission: z.enum(['automatic', 'manual']).optional(),
    category: z.enum(['economy', 'luxury', 'suv', 'sports', 'electric', 'van']).optional(),
    min_price: z.coerce.number().min(0).optional(),
    max_price: z.coerce.number().min(0).optional(),
    seats: z.coerce.number().min(1).optional(),
    features: z.string().optional(),
    sort: z.enum(['recommended', 'price_asc', 'price_desc', 'newest']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(12),
  }).refine(data => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end > start;
  }, {
    message: 'End date must be after start date',
    path: ['end_date'],
  }),

  // Booking schemas
  createBooking: z.object({
    vehicle_id: z.coerce.number().positive('Vehicle ID is required'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    pickup_location_id: z.coerce.number().positive().optional(),
    return_location_id: z.coerce.number().positive().optional(),
    pickup_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format').optional(),
    return_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format').optional(),
    special_requests: z.string().max(1000).optional(),
    flight_number: z.string().max(20).optional(),
    extras: z.object({
      gps: z.boolean().optional(),
      child_seat: z.boolean().optional(),
      additional_driver: z.boolean().optional(),
      insurance: z.enum(['basic', 'premium', 'elite']).optional(),
      roadside_assistance: z.boolean().optional(),
      prepaid_fuel: z.boolean().optional(),
    }).optional(),
  }).refine(data => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      return false;
    }
    return end > start;
  }, {
    message: 'Start date must be today or in the future, and end date must be after start date',
  }),

  previewPricing: z.object({
    vehicle_id: z.coerce.number().positive('Vehicle ID is required'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    extras: z.object({
      gps: z.boolean().optional(),
      child_seat: z.boolean().optional(),
      additional_driver: z.boolean().optional(),
      insurance: z.enum(['basic', 'premium', 'elite']).optional(),
      roadside_assistance: z.boolean().optional(),
      prepaid_fuel: z.boolean().optional(),
    }).optional(),
  }),

  // Payment schemas
  initializePayment: z.object({
    booking_id: z.coerce.number().positive('Booking ID is required'),
  }),

  verifyPayment: z.object({
    reference: z.string().min(1, 'Payment reference is required'),
  }),

  // Admin vehicle schemas
  createVehicle: z.object({
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.coerce.number().min(1990).max(new Date().getFullYear() + 2),
    license_plate: z.string().min(1, 'License plate is required'),
    fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']).default('petrol'),
    transmission: z.enum(['automatic', 'manual']).default('automatic'),
    daily_rate: z.coerce.number().positive('Daily rate must be positive'),
    category: z.enum(['economy', 'luxury', 'suv', 'sports', 'electric', 'van']).default('economy'),
    seats: z.coerce.number().min(1).max(50).default(5),
    luggage_capacity: z.coerce.number().min(0).default(2),
    features: z.array(z.string()).default([]),
    photo_urls: z.array(z.string().url()).default([]),
    status: z.enum(['available', 'maintenance', 'retired']).default('available'),
    location_id: z.coerce.number().positive().optional(),
  }),

  updateVehicle: z.object({
    make: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    year: z.coerce.number().min(1990).max(new Date().getFullYear() + 2).optional(),
    license_plate: z.string().min(1).optional(),
    fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']).optional(),
    transmission: z.enum(['automatic', 'manual']).optional(),
    daily_rate: z.coerce.number().positive().optional(),
    category: z.enum(['economy', 'luxury', 'suv', 'sports', 'electric', 'van']).optional(),
    seats: z.coerce.number().min(1).max(50).optional(),
    luggage_capacity: z.coerce.number().min(0).optional(),
    features: z.array(z.string()).optional(),
    photo_urls: z.array(z.string().url()).optional(),
    status: z.enum(['available', 'maintenance', 'retired']).optional(),
    location_id: z.coerce.number().positive().optional(),
    current_odometer: z.coerce.number().min(0).optional(),
  }),

  // Admin booking schemas
  patchBooking: z.object({
    status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled']).optional(),
    pickup_odometer: z.coerce.number().min(0).optional(),
    return_odometer: z.coerce.number().min(0).optional(),
    damage_charge: z.coerce.number().min(0).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),

  // Pagination schema for list endpoints
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    status: z.string().optional(),
  }),
};

// Middleware factory for specific sources
export const validateBody = (schema) => validate(schema, 'body');
export const validateQuery = (schema) => validate(schema, 'query');
export const validateParams = (schema) => validate(schema, 'params');
