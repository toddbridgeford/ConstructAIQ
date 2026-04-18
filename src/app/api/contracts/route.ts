Create src/app/api/contracts/route.ts

Fetch from USASpending.gov API:
https://api.usaspending.gov/api/v2/search/spending_by_award/

Filter: NAICS codes 23* (all construction)
Return: Top 20 contract awards by value, last 30 days
Fields: award_id, recipient_name, award_amount, 
        place_of_performance_state, description

No API key required — public endpoint.
