# Adzuna API - Quick Reference

## Environment Setup

### API Credentials (Built-in)
```
App ID: 
App Key: 
```

### Requirements
- Node.js 18+ (for native fetch API)
- SQLite database
- Express.js server running

## API Endpoints

### 1️⃣ GET `/api/jobs` - Fetch Jobs

**Default: Database**
```bash
curl "http://localhost:5000/api/jobs"
```

**From Adzuna API:**
```bash
curl "http://localhost:5000/api/jobs?source=adzuna"
```

**Parameters:**
- `source` = `'adzuna'` | `'db'` (default: db)
- `country` = Country code (default: 'us')
  - Options: us, gb, ca, au, fr, de, nl, at, be, ch, cz, dk, fi, hu, ie, it, no, pl, pt, ru, sg
- `page` = Page number (default: 1)
- `limit` = Results per page (default: 50, max: 50)
- `category` = Job category (optional)

**Examples:**

```bash
# 50 US jobs from Adzuna
curl "http://localhost:5000/api/jobs?source=adzuna&country=us&limit=50"

# 20 UK jobs
curl "http://localhost:5000/api/jobs?source=adzuna&country=gb&limit=20"

# IT jobs category
curl "http://localhost:5000/api/jobs?source=adzuna&country=us&category=it-jobs"

# Page 2
curl "http://localhost:5000/api/jobs?source=adzuna&page=2"
```

---

### 2️⃣ GET `/api/jobs/search` - Search Jobs

**Search by keywords:**
```bash
curl "http://localhost:5000/api/jobs/search?keywords=Python%20Developer"
```

**Parameters:**
- `keywords` = Search terms (required)
- `country` = Country code (default: 'us')
- `page` = Page number (default: 1)
- `limit` = Results per page (default: 50, max: 50)

**Examples:**

```bash
# Search for React developers in US
curl "http://localhost:5000/api/jobs/search?keywords=React%20Developer"

# Search for Data Scientists in UK
curl "http://localhost:5000/api/jobs/search?keywords=Data%20Scientist&country=gb"

# Search + pagination
curl "http://localhost:5000/api/jobs/search?keywords=JavaScript&page=2&limit=25"
```

---

### 3️⃣ POST `/api/jobs/sync-to-db` - Save to Database

**Sync jobs from Adzuna to your database:**
```bash
curl -X POST http://localhost:5000/api/jobs/sync-to-db \
  -H "Content-Type: application/json" \
  -d @jobs.json
```

**Request body (jobs.json):**
```json
{
  "jobs": [
    {
      "title": "Senior Backend Engineer",
      "company": "Amazon",
      "description": "Build scalable cloud services...",
      "requirements": "[\"Java\", \"AWS\", \"Docker\"]",
      "location": "Seattle, WA, US",
      "salary_range": "$150k - $250k",
      "type": "Full-time",
      "external_id": "job_12345",
      "external_url": "https://www.adzuna.com/details/12345"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Successfully synced 1 jobs to database",
  "count": 1,
  "ids": [42]
}
```

---

## JavaScript/TypeScript Usage

### Fetch Jobs (React)
```typescript
async function fetchJobs(keywords?: string, country: string = 'us') {
  try {
    const url = keywords
      ? `/api/jobs/search?keywords=${encodeURIComponent(keywords)}&country=${country}`
      : `/api/jobs?source=adzuna&country=${country}&limit=50`;

    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Found ${data.jobs.length} jobs`);
    return data.jobs;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Usage
const pythonJobs = await fetchJobs('Python Developer');
const ukJobs = await fetchJobs(undefined, 'gb');
```

### Sync & Save Jobs
```typescript
async function syncJobsToDatabase(jobs: any[]) {
  try {
    const response = await fetch('/api/jobs/sync-to-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs })
    });
    
    const result = await response.json();
    console.log(`Synced ${result.count} jobs`);
    return result.ids;
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Usage - Get from Adzuna and save
const jobs = await fetchJobs('React Developer');
const ids = await syncJobsToDatabase(jobs);
```

---

## Service Usage (Backend)

### Import the service
```typescript
import { fetchAdzunaJobs, searchAdzunaJobs } from '../adzunaService.ts';
```

### Fetch all jobs
```typescript
const jobs = await fetchAdzunaJobs('us', undefined, 1, 50);
console.log(jobs[0]);
// Output: {
//   title: "...",
//   company: "...",
//   requirements: "[\"skill1\", \"skill2\"]",
//   ...
// }
```

### Search jobs
```typescript
const jobs = await searchAdzunaJobs('us', 'Python Developer', 1, 50);
```

### Get with category
```typescript
const jobs = await fetchAdzunaJobs('us', 'it-jobs', 1, 50);
```

---

## Common Patterns

### Pattern 1: Fetch and Display
```typescript
// Component
const [jobs, setJobs] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchJobs('Software Engineer')
    .then(setJobs)
    .finally(() => setLoading(false));
}, []);

if (loading) return <p>Loading...</p>;
return <div>{jobs.map(job => <JobCard key={job.external_id} job={job} />)}</div>;
```

### Pattern 2: Search + Filter
```typescript
const [query, setQuery] = useState('');
const [country, setCountry] = useState('us');

async function handleSearch() {
  const jobs = await fetchJobs(query, country);
  setJobs(jobs);
}

// UI
<input value={query} onChange={e => setQuery(e.target.value)} />
<select value={country} onChange={e => setCountry(e.target.value)}>
  <option value="us">United States</option>
  <option value="gb">United Kingdom</option>
</select>
<button onClick={handleSearch}>Search</button>
```

### Pattern 3: Sync & Apply
```typescript
// User finds job on Adzuna, you sync it, user applies
async function applyToAdzunaJob(adzunaJob: any) {
  // 1. Sync job to database
  await syncJobsToDatabase([adzunaJob]);
  
  // 2. Find the job in database
  const savedJob = await fetch(`/api/jobs?source=db&external_id=${adzunaJob.external_id}`);
  
  // 3. Apply
  await fetch(`/api/jobs/${savedJob.id}/apply`, {
    method: 'POST',
    body: JSON.stringify({ userId: currentUser.id })
  });
}
```

---

## Testing

### Test all endpoints
```bash
# 1. Fetch from Adzuna
curl "http://localhost:5000/api/jobs?source=adzuna&limit=5"

# 2. Search
curl "http://localhost:5000/api/jobs/search?keywords=JavaScript&limit=5"

# 3. Database (empty initially)
curl "http://localhost:5000/api/jobs?source=db"
```

### Using Postman
1. Import collection from examples below
2. Set {{base_url}} = http://localhost:5000
3. Run tests

---

## Job Categories

```
graduate-jobs       - Entry-level positions
it-jobs             - Technology roles
healthcare-jobs     - Medical positions
finance-jobs        - Financial services
engineering-jobs    - Engineering roles
sales-jobs          - Sales positions
marketing-jobs      - Marketing roles
hospitality-jobs    - Hospitality roles
```

---

## Response Format

### Success (200)
```json
{
  "source": "adzuna",
  "country": "us",
  "page": 1,
  "limit": 50,
  "total": 50,
  "jobs": [
    {
      "title": "string",
      "company": "string",
      "description": "string",
      "requirements": "JSON string array",
      "location": "string",
      "salary_range": "string",
      "type": "Full-time|Part-time|Contract|...",
      "external_id": "string",
      "external_url": "string"
    }
  ]
}
```

### Error (400+)
```json
{
  "error": "Error description"
}
```

---

## Limits & Quotas

- **Max per page**: 50 jobs
- **Pagination**: Unlimited pages
- **API calls**: Check Adzuna documentation
- **Timeout**: 30 seconds per request

---

## File Locations

- **Service**: `/src/server/adzunaService.ts`
- **Routes**: `/src/server/routes/jobs.ts`
- **Guide**: `/ADZUNA_API_GUIDE.md`
- **Summary**: `/ADZUNA_IMPLEMENTATION_SUMMARY.md`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No jobs returned | Check country code, keywords, internet connection |
| 400 Bad Request | Check query parameters and syntax |
| Database empty | Run `POST /api/jobs/sync-to-db` to save jobs |
| Slow responses | Reduce `limit`, cache results, check server logs |
| 500 Server Error | Check server logs, verify Node.js 18+ |

---

## Next Steps

1. ✅ **Read**: [ADZUNA_API_GUIDE.md](./ADZUNA_API_GUIDE.md)
2. ✅ **Review**: [ADZUNA_IMPLEMENTATION_SUMMARY.md](./ADZUNA_IMPLEMENTATION_SUMMARY.md)
3. ✅ **Test**: `npm run dev` then run curl examples
4. ✅ **Integrate**: Update your frontend to use the new endpoints
5. ✅ **Deploy**: Move API keys to environment variables

---

**Ready to go! Start with: `npm run dev`**
