# Adzuna Integration - Implementation Summary

## Overview
PathForge has been successfully integrated with the **Adzuna Job API** to fetch real, live job listings instead of using dummy/mock data. This change provides users with access to thousands of real job opportunities across multiple countries.

## Changes Made

### 1. **New Files Created**

#### `/src/server/adzunaService.ts`
Complete Adzuna API integration service with:
- `fetchAdzunaJobs()` - Fetch jobs by country/category
- `searchAdzunaJobs()` - Search jobs by keywords
- `processAdzunaJob()` - Transform API response to database schema
- `getAdzunaCategories()` - Get available job categories
- Helper functions for data formatting and cleaning
- Full TypeScript support with interfaces

**API Credentials (Embedded):**
```
App ID: f448502e
App Key: 7816e36630e9802e2c7e656b419716f9
```

#### `/ADZUNA_API_GUIDE.md`
Comprehensive documentation including:
- API endpoint specifications
- Query parameters and examples
- cURL and code examples for common tasks
- Supported countries and job categories
- Error handling guidelines
- Best practices
- FAQ section

#### `/setup-adzuna.ps1`
PowerShell setup and testing script for Windows users to:
- Initialize database
- Run API integration tests
- Validate Adzuna connectivity

#### `/setup-adzuna.sh`
Bash setup script for Linux/Mac users

### 2. **Modified Files**

#### `/src/server/routes/jobs.ts`
**Updated Endpoints:**

1. **GET `/api/jobs/`** - Enhanced with dual-source capability
   - Query: `source=adzuna|db`, `country`, `page`, `limit`, `category`
   - Returns jobs from Adzuna API or database
   - Default: Database source for backward compatibility

2. **POST `/api/jobs/`** - Unchanged (recruiter job posting)

3. **GET `/api/jobs/search`** ⭐ **NEW**
   - Search jobs by keywords from Adzuna
   - Query: `keywords` (required), `country`, `page`, `limit`
   - Example: `/api/jobs/search?keywords=Python%20Developer&country=us`

4. **POST `/api/jobs/sync-to-db`** ⭐ **NEW**
   - Sync Adzuna jobs to local database
   - Stores jobs with `posted_by: null` to distinguish from recruiter jobs
   - Allows offline access and user applications
   - Request body: `{ jobs: ProcessedJob[] }`

#### `/src/server/db.ts`
**Changes:**
- ✅ Removed 500 dummy jobs seeding
- ✅ Removed 1000+ dummy applications seeding
- ✅ Added migration for new database columns
- ✅ Added external_id and external_url columns to jobs table
- Added console message: "Skipping dummy job seeding - use Adzuna API for real jobs"

#### `/schema.sql`
**Schema Updates:**
- Added `external_id TEXT` column to jobs table (Adzuna ID)
- Added `external_url TEXT` column to jobs table (Direct link)

## Database Schema Updates

### Jobs Table - New Columns
```sql
ALTER TABLE jobs ADD COLUMN external_id TEXT;      -- Adzuna job ID for tracking
ALTER TABLE jobs ADD COLUMN external_url TEXT;     -- Direct link to original job posting
```

These are automatically added during database initialization if using `npm run seed`.

## Data Mapping

Adzuna API fields are automatically mapped to PathForge schema:

| Source | Target | Example |
|--------|--------|---------|
| Adzuna: title | jobs.title | "Senior Software Engineer" |
| Adzuna: company.display_name | jobs.company | "Google" |
| Adzuna: description | jobs.description | "Join our engineering team..." |
| Adzuna: (extracted) | jobs.requirements | ["Python", "AWS", "Docker"] |
| Adzuna: location.display_name | jobs.location | "San Francisco, CA, US" |
| Adzuna: salary_min/max | jobs.salary_range | "$150k - $250k" |
| Adzuna: contract_type | jobs.type | "Full-time" |
| Adzuna: id | jobs.external_id | "job_123456" |
| Adzuna: redirect_url | jobs.external_url | "https://www.adzuna.com/details/..." |

## Key Features

✅ **Real Job Data** - Access 1000s of actual job listings
✅ **Multi-Country Support** - Search jobs in 20+ countries
✅ **Keyword Search** - Find specific roles or skills
✅ **Smart Parsing** - Auto-extract requirements from descriptions
✅ **Database Sync** - Save jobs locally for offline access
✅ **Pagination** - Handle large result sets efficiently
✅ **Distinction** - Separate recruiter-posted from Adzuna jobs
✅ **Backward Compatible** - Existing applications still work
✅ **No Dummy Data** - Only real jobs in the system

## API Usage Examples

### Fetch jobs from Adzuna (US)
```bash
curl "http://localhost:5000/api/jobs?source=adzuna&country=us&page=1&limit=50"
```

### Search for Python developers
```bash
curl "http://localhost:5000/api/jobs/search?keywords=Python%20Developer&country=us"
```

### Sync jobs to database
```bash
curl -X POST http://localhost:5000/api/jobs/sync-to-db \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {
        "title": "Backend Engineer",
        "company": "Amazon",
        "description": "Build scalable systems",
        "requirements": "[\"Java\", \"AWS\"]",
        "location": "Seattle, WA",
        "salary_range": "$100k - $150k",
        "type": "Full-time",
        "external_id": "abc123",
        "external_url": "https://..."
      }
    ]
  }'
```

## Frontend Integration

### Example React Component
```typescript
// Fetch jobs from Adzuna
async function loadJobs(keywords?: string) {
  try {
    const url = keywords 
      ? `/api/jobs/search?keywords=${encodeURIComponent(keywords)}`
      : '/api/jobs?source=adzuna&country=us&limit=50';
    
    const response = await fetch(url);
    const data = await response.json();
    console.log(`Found ${data.total} jobs`);
    setJobs(data.jobs);
  } catch (error) {
    console.error('Failed to load jobs:', error);
  }
}
```

## Migration Path

### If you had a database with dummy jobs:

1. **Option 1: Fresh Start (Recommended)**
   ```bash
   npm run seed
   ```
   - Clears all old data
   - Creates new schema with Adzuna columns
   - No dummy jobs created
   
2. **Option 2: Keep Existing Users**
   - Run database migrations manually
   - Old jobs remain until you sync new Adzuna jobs with `POST /api/jobs/sync-to-db`
   - Applications remain linked to old jobs

## Supported Countries

| Code | Country | Code | Country |
|------|---------|------|---------|
| us | United States | ch | Switzerland |
| gb | United Kingdom | cz | Czech Republic |
| ca | Canada | dk | Denmark |
| au | Australia | fi | Finland |
| fr | France | hu | Hungary |
| de | Germany | ie | Ireland |
| nl | Netherlands | it | Italy |
| at | Austria | no | Norway |
| be | Belgium | pl | Poland |
|   |   | pt | Portugal |
|   |   | sg | Singapore |

## Testing

### Quick Test (Windows)
```powershell
.\setup-adzuna.ps1
```

### Quick Test (Linux/Mac)
```bash
bash setup-adzuna.sh
```

### Manual Test
```bash
# Start the server
npm run dev

# In another terminal
# Test 1: Fetch from Adzuna
curl "http://localhost:5000/api/jobs?source=adzuna&limit=5"

# Test 2: Search
curl "http://localhost:5000/api/jobs/search?keywords=JavaScript"

# Test 3: From database (empty initially)
curl "http://localhost:5000/api/jobs?source=db"
```

## Troubleshooting

### No jobs returned from Adzuna
- Check internet connection
- Verify API credentials in `/src/server/adzunaService.ts`
- Try a different country or keywords

### Database columns missing
- Run `npm run seed` to initialize the database
- Or manually run the SQL migrations in `/src/server/db.ts`

### Applications can't find jobs
- Ensure jobs are synced with `POST /api/jobs/sync-to-db`
- Check that jobs table has records with `posted_by IS NULL` for Adzuna jobs

### Performance issues
- Reduce `limit` parameter (max 50)
- Cache results in database
- Implement pagination

## Security Considerations

**Current Setup:**
- API credentials are embedded in the code (for development)

**For Production:**
- Move credentials to `.env` file:
  ```env
  ADZUNA_APP_ID=f448502e
  ADZUNA_APP_KEY=7816e36630e9802e2c7e656b419716f9
  ```
- Load from environment in `adzunaService.ts`
- Never commit `.env` to version control

## Performance Optimization

### Cache jobs locally
```typescript
// Fetch from Adzuna and save to database
const adzunaJobs = await fetchAdzunaJobs('us');
await fetch('/api/jobs/sync-to-db', {
  method: 'POST',
  body: JSON.stringify({ jobs: adzunaJobs })
});

// Subsequent requests use database
fetch('/api/jobs?source=db');
```

### Scheduled refresh (Node.js)
```typescript
setInterval(async () => {
  const jobs = await fetchAdzunaJobs('us', undefined, 1, 100);
  // Save to database...
}, 24 * 60 * 60 * 1000); // Daily
```

## Files Changed Summary

```
✨ Created:
  - /src/server/adzunaService.ts (287 lines)
  - /ADZUNA_API_GUIDE.md (500+ lines)
  - /setup-adzuna.ps1
  - /setup-adzuna.sh

📝 Modified:
  - /src/server/routes/jobs.ts
    - Updated GET / - Dual source (db/adzuna)
    - Added GET /search - Keyword search
    - Added POST /sync-to-db - Database sync
  
  - /src/server/db.ts
    - Removed 500 dummy jobs seeding
    - Removed 1000 dummy applications
    - Added migration for new columns
  
  - /schema.sql
    - Added external_id column
    - Added external_url column
```

## Next Steps

1. **Run Setup**
   ```bash
   npm run seed
   npm run dev
   ```

2. **Test API**
   ```powershell
   .\setup-adzuna.ps1
   ```

3. **Update Frontend (if needed)**
   - Update job fetching to use `?source=adzuna`
   - Add search functionality
   - Show Adzuna link in job details

4. **Deploy**
   - Move API credentials to environment variables
   - Cache jobs in database for performance
   - Monitor API usage
   - Set up scheduled job refreshes

## References

- **Adzuna Developer API**: https://developer.adzuna.com/
- **API Documentation**: https://api.adzuna.com/v1/doc
- **Integration Guide**: See `/ADZUNA_API_GUIDE.md`

---

✅ **Implementation Complete!**

All dummy jobs have been removed and replaced with a real Adzuna API integration. Your application now has access to thousands of live job opportunities.
