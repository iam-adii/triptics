# Database Seeding Instructions

To seed your database with sample data, follow these steps:

1. Log in to your Supabase dashboard
2. Navigate to the SQL editor
3. Create a new query
4. Copy and paste the contents of `seed.sql` into the SQL editor
5. Click "Run" to execute the queries

## Sample Data Overview

The seed data includes:

### Company Settings
- Basic company information for Triptics Travel Agency

### Users (3)
- John Doe (Admin)
- Jane Smith (Manager)
- Mike Johnson (Agent)

### Customers (5)
- Various customers with different locations and contact details

### Leads (5)
- Different lead statuses and sources
- Various tour interests

### Bookings (5)
- Different tour packages
- Various statuses (Confirmed, Pending, Cancelled)
- Different dates and group sizes

### Payments (7)
- Mix of payment methods
- Different payment statuses
- Includes partial payments and installments

## Notes

- The seed script first cleans existing data to avoid duplicates
- All timestamps use the database's NOW() function
- IDs are prefixed for easy identification (e.g., cust_01, book_01)
- Relationships between tables are maintained (e.g., bookings reference customers)

## Verification

After running the seed script, you can verify the data using these queries:

```sql
-- Check customer count
SELECT COUNT(*) FROM customers;

-- Check booking statuses
SELECT status, COUNT(*) FROM bookings GROUP BY status;

-- Check payment totals
SELECT SUM(amount) FROM payments WHERE status = 'Completed';

-- Check lead sources
SELECT source, COUNT(*) FROM leads GROUP BY source;
```

## Troubleshooting

If you encounter any errors:
1. Ensure all tables exist with the correct schema
2. Check for any constraint violations
3. Run the DELETE statements first to clear existing data
4. Execute statements one by one if needed 