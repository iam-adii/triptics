-- Reset tables (if needed)
DELETE FROM payments;
DELETE FROM itinerary_activities;
DELETE FROM itinerary_days;
DELETE FROM itineraries;
DELETE FROM calendar_events;
DELETE FROM bookings;
DELETE FROM tours;
DELETE FROM leads;
DELETE FROM customers;
DELETE FROM company_settings;

-- Insert company settings
INSERT INTO company_settings (id, name, website, address, country, timezone, logo_url, created_at, updated_at) VALUES
(gen_random_uuid(), 'Triptics Travel Agency', 'https://triptics.example.com', '123 Tourism Street, Travel City', 'US', 'America/New_York', 'https://example.com/logo.png', NOW(), NOW());

-- Insert customers with more realistic data
INSERT INTO customers (id, name, email, phone, address, total_bookings, total_spent, created_at, updated_at) VALUES
(gen_random_uuid(), 'Alice Brown', 'alice@email.com', '+1-555-1001', '456 Oak St, San Francisco, CA, US', 0, 0.00, NOW() - interval '6 months', NOW()),
(gen_random_uuid(), 'Bob Wilson', 'bob@email.com', '+1-555-1002', '789 Pine St, Los Angeles, CA, US', 0, 0.00, NOW() - interval '5 months', NOW()),
(gen_random_uuid(), 'Carol Martinez', 'carol@email.com', '+1-555-1003', '321 Elm St, San Diego, CA, US', 0, 0.00, NOW() - interval '4 months', NOW()),
(gen_random_uuid(), 'David Johnson', 'david@email.com', '+1-555-1004', '654 Maple St, Seattle, WA, US', 0, 0.00, NOW() - interval '3 months', NOW()),
(gen_random_uuid(), 'Emma Davis', 'emma@email.com', '+1-555-1005', '987 Cedar St, Portland, OR, US', 0, 0.00, NOW() - interval '2 months', NOW());

-- Insert leads with various sources
INSERT INTO leads (id, name, email, phone, source, status, notes, created_at, updated_at) VALUES
(gen_random_uuid(), 'Frank Anderson', 'frank@email.com', '+1-555-2001', 'Website', 'New', 'Interested in Europe tours', NOW() - interval '6 months', NOW()),
(gen_random_uuid(), 'Grace Lee', 'grace@email.com', '+1-555-2002', 'Referral', 'Contacted', 'Looking for family vacation packages', NOW() - interval '5 months', NOW()),
(gen_random_uuid(), 'Henry Clark', 'henry@email.com', '+1-555-2003', 'Social Media', 'Qualified', 'Wants luxury cruise options', NOW() - interval '4 months', NOW()),
(gen_random_uuid(), 'Ivy Wong', 'ivy@email.com', '+1-555-2004', 'Google Ads', 'Contacted', 'Interested in Asia tours', NOW() - interval '3 months', NOW()),
(gen_random_uuid(), 'Jack Miller', 'jack@email.com', '+1-555-2005', 'Website', 'New', 'Looking for adventure tours', NOW() - interval '2 months', NOW()),
(gen_random_uuid(), 'Kelly Brown', 'kelly@email.com', '+1-555-2006', 'Social Media', 'Qualified', 'Honeymoon package inquiry', NOW() - interval '1 month', NOW()),
(gen_random_uuid(), 'Liam Wilson', 'liam@email.com', '+1-555-2007', 'Referral', 'New', 'Group tour inquiry', NOW(), NOW());

-- Insert tours with types and realistic pricing
INSERT INTO tours (id, name, description, price, duration_days, location, type, created_at, updated_at) VALUES
(gen_random_uuid(), 'European Discovery', 'Explore the best of Europe', 250000.00, 10, 'Europe', 'Luxury', NOW(), NOW()),
(gen_random_uuid(), 'Asian Adventure', 'Experience Asian culture and cuisine', 180000.00, 12, 'Asia', 'Adventure', NOW(), NOW()),
(gen_random_uuid(), 'African Safari', 'Wildlife and nature expedition', 300000.00, 8, 'Africa', 'Wildlife', NOW(), NOW()),
(gen_random_uuid(), 'Mediterranean Cruise', 'Luxury cruise experience', 400000.00, 15, 'Mediterranean', 'Cruise', NOW(), NOW()),
(gen_random_uuid(), 'Australian Outback', 'Explore the Australian wilderness', 220000.00, 10, 'Australia', 'Adventure', NOW(), NOW()),
(gen_random_uuid(), 'South American Trek', 'Discover ancient civilizations', 280000.00, 14, 'South America', 'Cultural', NOW(), NOW());

-- Insert bookings with varied statuses and dates
WITH tour_data AS (
  SELECT id, price FROM tours
)
INSERT INTO bookings (id, customer_id, tour_id, start_date, end_date, status, total_amount, notes, created_at, updated_at)
SELECT
  gen_random_uuid(),
  c.id,
  t.id,
  NOW() + (n || ' days')::interval,
  NOW() + ((n + 7) || ' days')::interval,
  CASE 
    WHEN n % 4 = 0 THEN 'Confirmed'
    WHEN n % 4 = 1 THEN 'Pending'
    WHEN n % 4 = 2 THEN 'Completed'
    ELSE 'Cancelled'
  END,
  t.price,
  'Booking notes ' || n,
  NOW() - ((6 - (n/30))::integer || ' months')::interval,
  NOW()
FROM 
  customers c
  CROSS JOIN tour_data t
  CROSS JOIN generate_series(0, 180, 30) n
WHERE 
  c.id IN (SELECT id FROM customers LIMIT 5)
  AND t.id IN (SELECT id FROM tours LIMIT 6);

-- Insert payments for confirmed bookings
INSERT INTO payments (id, booking_id, payment_id, amount, status, method, date, notes, created_at, updated_at)
SELECT
  gen_random_uuid(),
  b.id,
  'PAY-' || gen_random_uuid(),
  b.total_amount,
  CASE 
    WHEN b.status = 'Confirmed' THEN 'Completed'
    WHEN b.status = 'Pending' THEN 'Pending'
    ELSE 'Cancelled'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Credit Card'
    WHEN 1 THEN 'Bank Transfer'
    WHEN 2 THEN 'UPI'
    ELSE 'Cash'
  END,
  b.created_at,
  'Payment for booking',
  b.created_at,
  b.created_at
FROM bookings b
WHERE b.status IN ('Confirmed', 'Completed');

-- Update customer statistics
WITH booking_totals AS (
  SELECT 
    customer_id,
    COUNT(*) as booking_count,
    SUM(CASE WHEN status IN ('Confirmed', 'Completed') THEN total_amount ELSE 0 END) as total_amount
  FROM bookings
  GROUP BY customer_id
)
UPDATE customers c
SET 
  total_bookings = bt.booking_count,
  total_spent = bt.total_amount
FROM booking_totals bt
WHERE c.id = bt.customer_id;

-- Insert itinerary_days
WITH itinerary_ids AS (
  SELECT id, start_date FROM temp_itinerary_ids
)
INSERT INTO itinerary_days (id, itinerary_id, day_number, date, created_at, updated_at)
SELECT
  gen_random_uuid(),
  i.id,
  d.day_number,
  i.start_date + ((d.day_number - 1) || ' days')::interval,
  NOW(),
  NOW()
FROM itinerary_ids i
CROSS JOIN (SELECT generate_series(1, 5) as day_number) d;

-- Create temporary table for itinerary day IDs
CREATE TEMP TABLE temp_itinerary_day_ids AS
SELECT id FROM itinerary_days;

-- Insert itinerary_activities
WITH itinerary_day_ids AS (
  SELECT id FROM temp_itinerary_day_ids
)
INSERT INTO itinerary_activities (id, itinerary_day_id, title, description, time_start, time_end, location, sort_order, created_at, updated_at, is_transfer)
SELECT
  gen_random_uuid(),
  id,
  'Activity ' || a.activity_number,
  'Description for activity ' || a.activity_number,
  '09:00'::time + ((a.activity_number - 1) || ' hours')::interval,
  '10:00'::time + ((a.activity_number - 1) || ' hours')::interval,
  'Location ' || a.activity_number,
  a.activity_number,
  NOW(),
  NOW(),
  false
FROM itinerary_day_ids
CROSS JOIN (SELECT generate_series(1, 3) as activity_number) a;

-- Insert calendar_events
INSERT INTO calendar_events (id, title, description, start_date, end_date, color, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Tour: ' || i.name,
  'Itinerary to ' || i.destination,
  i.start_date,
  i.end_date,
  CASE 
    WHEN i.status = 'Confirmed' THEN '#00FF00'
    WHEN i.status = 'Pending' THEN '#FFFF00'
    ELSE '#FF0000'
  END,
  NOW(),
  NOW()
FROM itineraries i;

-- Clean up temporary tables
DROP TABLE IF EXISTS temp_itinerary_ids;
DROP TABLE IF EXISTS temp_itinerary_day_ids; 