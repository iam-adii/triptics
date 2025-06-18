-- Update route descriptions for existing itinerary days
UPDATE itinerary_days id
SET route_description = tr.description
FROM transfer_routes tr
WHERE id.route_name = tr.name
AND id.route_description IS NULL
AND id.route_name IS NOT NULL; 