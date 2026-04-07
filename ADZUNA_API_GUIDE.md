# Adzuna API Integration Guide

## Overview

PathForge now integrates with the **Adzuna API** to fetch real job listings instead of using dummy jobs. This replaces the static mock data with live job opportunities from across multiple countries and industries.

## API Credentials

The following credentials are configured and embedded in the system:

```
App ID: f448502e
App Key: 7816e36630e9802e2c7e656b419716f9
```

> **Note:** These credentials are embedded in `/src/server/adzunaService.ts`. For production deployment, consider moving them to environment variables for security.

## Key Features

- **Real Job Data**: Fetch live jobs from Adzuna's extensive database
- **Multi-Country Support**: Search jobs across multiple countries
- **Keyword Search**: Search for specific job titles, skills, or industries
- **Flexible Pagination**: Navigate through results with page-based pagination
- **Database Sync**: Save jobs to your local database for offline access and user applications
- **Smart Parsing**: Automatically extracts requirements and formats job data to match your schema

## API Endpoints

### 1. GET `/api/jobs/` - Fetch Jobs

Retrieve jobs from either the database or Adzuna API.

**Query Parameters:**
- `source` (string): `'db'` or `'adzuna'` - Data source (default: `'db'`)
- `country` (string): Country code (default: `'us'`)
  - Supported: `us`, `gb`, `ca`, `au`, `fr`, `de`, `nl`, `at`, `be`, `ch`, `cz`, `dk`, `fi`, `hu`, `ie`, `it`, `no`, `pl`, `pt`, `ru`, `sg`
- `page` (number): Page number (default: `1`)
- `limit` (number): Results per page (default: `50`, max: `50`)
- `category` (string): Job category (optional)

**Example Requests:**

```bash
# Fetch from Adzuna (US, page 1)
curl "http://localhost:5000/api/jobs?source=adzuna&country=us&page=1&limit=50"

# Fetch from database
curl "http://localhost:5000/api/jobs?source=db&page=1"

# Fetch from Adzuna (UK, with limit)
curl "http://localhost:5000/api/jobs?source=adzuna&country=gb&limit=25"
```

**Response:**
```json
{
  "source": "adzuna",
  "page": 1,
  "limit": 50,
  "country": "us",
  "total": 50,
  "jobs": [
    {
      "title": "Senior Software Engineer",
      "company": "Google",
      "description": "Join our engineering team...",
      "requirements": "[\"Python\", \"JavaScript\", \"AWS\"]",
      "location": "San Francisco, CA, US",
      "salary_range": "$120k - $200k",
      "type": "Full-time",
      "external_id": "job_id_12345",
      "external_url": "https://www.adzuna.com/details/12345"
    }
    // ... more jobs
  ]
}
```

### 2. GET `/api/jobs/search?keywords=...` - Search Jobs

Search for specific jobs using keywords.

**Query Parameters:**
- `keywords` (string, required): Search terms (e.g., "Python Developer", "React")
- `country` (string): Country code (default: `'us'`)
- `page` (number): Page number (default: `1`)
- `limit` (number): Results per page (default: `50`, max: `50`)

**Example Requests:**

```bash
# Search for Python developers in the US
curl "http://localhost:5000/api/jobs/search?keywords=Python%20Developer&country=us"

# Search for React jobs in UK
curl "http://localhost:5000/api/jobs/search?keywords=React&country=gb&limit=25"

# Search with pagination
curl "http://localhost:5000/api/jobs/search?keywords=Data%20Scientist&page=2&limit=50"
```

**Response:**
```json
{
  "source": "adzuna",
  "keywords": "Python Developer",
  "country": "us",
  "page": 1,
  "limit": 50,
  "total": 50,
  "jobs": [
    // ... matching jobs
  ]
}
```

### 3. POST `/api/jobs/sync-to-db` - Sync Jobs to Database

Save Adzuna jobs to your local database for offline access and user applications.

**Request Body:**
```json
{
  "jobs": [
    {
      "title": "Senior Software Engineer",
      "company": "Google",
      "description": "...",
      "requirements": "[\"Python\", \"JavaScript\"]",
      "location": "San Francisco, CA, US",
      "salary_range": "$120k - $200k",
      "type": "Full-time",
      "external_id": "12345",
      "external_url": "https://www.adzuna.com/details/12345"
    }
    // ... more jobs
  ]
}
```

**Example:**

```bash
# Sync 50 jobs from Adzuna to database
curl -X POST http://localhost:5000/api/jobs/sync-to-db \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {
        "title": "Backend Developer",
        "company": "Amazon",
        "description": "Build scalable systems...",
        "requirements": "[\"Java\", \"AWS\", \"Docker\"]",
        "location": "Seattle, WA, US",
        "salary_range": "$100k - $150k",
        "type": "Full-time",
        "external_id": "abc123",
        "external_url": "https://adzuna.com/details/abc123"
      }
    ]
  }'
```

**Response:**
```json
{
  "message": "Successfully synced 50 jobs to database",
  "count": 50,
  "ids": [1, 2, 3, ..., 50]
}
```

## Common Job Categories

When using the `category` parameter with Adzuna:

- `graduate-jobs` - Entry-level positions for graduates
- `it-jobs` - Information Technology positions
- `healthcare-jobs` - Medical and healthcare roles
- `finance-jobs` - Financial services positions
- `engineering-jobs` - Engineering roles
- `sales-jobs` - Sales and business development
- `marketing-jobs` - Marketing and communications
- `hospitality-jobs` - Hospitality and tourism

## Supported Countries

| Code | Country |
|------|---------|
| us | United States |
| gb | United Kingdom |
| ca | Canada |
| au | Australia |
| fr | France |
| de | Germany |
| nl | Netherlands |
| at | Austria |
| be | Belgium |
| ch | Switzerland |
| cz | Czech Republic |
| dk | Denmark |
| fi | Finland |
| hu | Hungary |
| ie | Ireland |
| it | Italy |
| no | Norway |
| pl | Poland |
| pt | Portugal |
| ru | Russia |
| sg | Singapore |

## Usage Examples

### Frontend Integration

```typescript
// Fetch jobs from Adzuna API
async function loadAdzunaJobs(keywords?: string) {
  try {
    let url = '/api/jobs';
    if (keywords) {
      url = `/api/jobs/search?keywords=${encodeURIComponent(keywords)}`;
    } else {
      url += '?source=adzuna&country=us&limit=50';
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Found ${data.total} jobs`);
    displayJobs(data.jobs);
  } catch (error) {
    console.error('Failed to load jobs:', error);
  }
}

// Sync jobs to database
async function syncJobsToDatabase(jobs: any[]) {
  try {
    const response = await fetch('/api/jobs/sync-to-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs })
    });
    
    const result = await response.json();
    console.log(`Synced ${result.count} jobs to database`);
  } catch (error) {
    console.error('Failed to sync jobs:', error);
  }
}
```

### Scheduled Job Updates (Node.js)

```typescript
import { fetchAdzunaJobs } from './src/server/adzunaService.ts';
import db from './src/server/db.ts';

// Update jobs every 24 hours
setInterval(async () => {
  try {
    console.log('Updating jobs from Adzuna...');
    
    // Fetch fresh jobs
    const jobs = await fetchAdzunaJobs('us', undefined, 1, 50);
    
    // Clear old external jobs (keep recruiter-posted jobs)
    await db('jobs').where({ posted_by: null }).delete();
    
    // Insert new jobs
    const formattedJobs = jobs.map(job => ({
      ...job,
      posted_by: null,
      status: 'open'
    }));
    
    await db('jobs').insert(formattedJobs);
    console.log(`Updated ${formattedJobs.length} jobs`);
  } catch (error) {
    console.error('Job update failed:', error);
  }
}, 24 * 60 * 60 * 1000);
```

## Data Mapping

Adzuna fields are automatically mapped to your database schema:

| Adzuna Field | Database Field | Notes |
|--------------|----------------|-------|
| title | title | Job title |
| company.display_name | company | Company name |
| description | description | Job description (HTML removed) |
| (auto-extracted) | requirements | Key technical skills |
| location.display_name | location | Job location |
| salary_min/max | salary_range | Formatted salary range |
| contract_type | type | Full-time, Part-time, etc. |
| id | external_id | Adzuna job ID (for tracking) |
| redirect_url | external_url | Direct link to original job |

## Error Handling

### Common Errors

```json
{
  "error": "Keywords parameter is required"
}
```
→ Add `keywords` query parameter to search endpoint

```json
{
  "error": "Adzuna API error: 403 Forbidden"
}
→ Invalid API credentials or IP blocked by Adzuna**

```json
{
  "error": "Jobs array is required and must not be empty"
}
```
→ Include `jobs` array in sync request body

## Best Practices

1. **Cache Results**: Store Adzuna results in your database to reduce API calls
2. **Pagination**: Use pagination for large result sets
3. **Error Handling**: Implement retry logic for API failures
4. **Rate Limiting**: Adzuna API has usage limits; implement caching and queuing
5. **User Experience**: Show real jobs prominently, distinguish from recruiter-posted jobs
6. **Credentials**: Use environment variables in production, never commit API keys

## Technical Details

### Service File: `/src/server/adzunaService.ts`

Contains:
- `fetchAdzunaJobs()` - Main function to fetch jobs
- `searchAdzunaJobs()` - Search-specific function
- `processAdzunaJob()` - Data transformation
- `getAdzunaCategories()` - Fetch available job categories
- Helper functions for formatting and cleaning data

### Routes File: `/src/server/routes/jobs.ts`

Updated endpoints:
- `GET /` - Dual-source job fetching
- `GET /search` - Keyword-based search
- `POST /sync-to-db` - Database synchronization
- `POST /` - Recruiter job posting (unchanged)
- Other endpoints remain unchanged

## FAQ

**Q: How often should I update jobs?**
A: Daily or weekly depending on your needs. Use the sync-to-db endpoint with a scheduled task.

**Q: Can I filter by salary range?**
A: Not directly from Adzuna API, but you can filter results client-side after fetching.

**Q: Are salaries in all currencies?**
A: Salaries are in local currency of the selected country.

**Q: Can users apply to Adzuna jobs?**
A: Yes, applications are tracked in your database and linked to Adzuna jobs via `external_id`.

**Q: What's the maximum results per page?**
A: 50 jobs per request. Use pagination for more results.

## Support

For Adzuna API documentation, visit: https://developer.adzuna.com/
