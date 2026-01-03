# Advanced Features Documentation

## 📋 Table of Contents
1. [Seed Scripts](#seed-scripts)
2. [Image Upload](#image-upload)
3. [Email Notifications](#email-notifications)
4. [Enhanced Search & Filtering](#enhanced-search--filtering)
5. [Analytics Dashboard](#analytics-dashboard)

---

## 🌱 Seed Scripts

### Create Admin/Moderator Users

Run the seed script to create default admin, moderator, and test users:

```bash
npm run seed:users
```

This creates:
- **Admin**: `admin@communitysafety.com` / `admin123`
- **Moderator**: `moderator@communitysafety.com` / `moderator123`
- **Test User**: `user@communitysafety.com` / `user123`

### Seed Sample Data

Populate the database with sample incidents:

```bash
npm run seed:data
```

This creates:
- 3 sample users
- 8 sample incidents with various types and statuses

---

## 📸 Image Upload

### Configuration

Images are stored in `backend/uploads/` directory. The upload middleware:
- Accepts up to 5 images per incident
- Maximum file size: 5MB per image
- Supported formats: JPEG, JPG, PNG, GIF, WEBP

### Usage

**Postman/API Request:**
- Method: `POST`
- URL: `http://localhost:4000/api/incidents`
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- Body (form-data):
  - `type`: "fire"
  - `description`: "Fire outbreak"
  - `location`: "[7.4951, 9.0579]"
  - `address`: "Wuse Market, Abuja"
  - `images`: [Select files - up to 5 images]

**Accessing Uploaded Images:**
- Images are accessible at: `http://localhost:4000/uploads/<filename>`

---

## 📧 Email Notifications

### Configuration

Add these variables to your `.env` file:

```env
# Email Configuration (Optional - emails are skipped if not configured)
EMAIL_SERVICE=gmail  # or 'smtp'
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # For Gmail, use App Password
SMTP_HOST=smtp.gmail.com  # Only if using generic SMTP
SMTP_PORT=587
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in `EMAIL_PASSWORD`

### Email Templates

The system sends emails for:
1. **Incident Reported** - When a user submits an incident
2. **Incident Verified** - When moderator verifies an incident
3. **Incident Rejected** - When moderator rejects an incident
4. **Incident Resolved** - When moderator marks incident as resolved

**Note:** If email is not configured, the system will log the email details but won't send actual emails.

---

## 🔍 Enhanced Search & Filtering

### Public Endpoint: Get Verified Incidents

**GET** `/api/incidents/verified`

**Query Parameters:**
- `type` - Filter by incident type (road_hazard, theft, flooding, power_outage, fire, other)
- `search` - Text search in description
- `startDate` - Filter from date (ISO format: 2024-01-01)
- `endDate` - Filter to date (ISO format: 2024-01-31)
- `latitude` - Latitude for location-based search
- `longitude` - Longitude for location-based search
- `radius` - Search radius in km (default: 10)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order: asc or desc (default: desc)

**Example:**
```
GET /api/incidents/verified?type=fire&search=market&latitude=9.0579&longitude=7.4951&radius=5&page=1&limit=10
```

### Moderator Endpoint: Get All Incidents

**GET** `/api/incidents` (Requires Moderator/Admin)

**Additional Query Parameters:**
- `status` - Filter by status (reported, verified, rejected, resolved)
- `reportedBy` - Filter by reporter user ID
- `verifiedBy` - Filter by verifier user ID

**Example:**
```
GET /api/incidents?status=reported&type=fire&search=urgent&startDate=2024-01-01&endDate=2024-01-31
```

---

## 📊 Analytics Dashboard

All analytics endpoints require **Moderator/Admin** authentication.

### 1. Overall Statistics

**GET** `/api/analytics/overall`

Returns:
- Total incidents (all statuses)
- Total users
- Recent incidents (last 30 days)

### 2. Incidents by Type

**GET** `/api/analytics/by-type`

Returns breakdown of incidents by type with counts for verified and resolved.

### 3. Incidents by Status

**GET** `/api/analytics/by-status`

Returns count of incidents grouped by status.

### 4. Incidents Over Time

**GET** `/api/analytics/over-time?period=day&days=30`

**Query Parameters:**
- `period` - Grouping period: day, week, or month (default: day)
- `days` - Number of days to look back (default: 30)

Returns time series data for charts.

### 5. Top Reporters

**GET** `/api/analytics/top-reporters?limit=10`

**Query Parameters:**
- `limit` - Number of top reporters (default: 10)

Returns users with most incident reports.

### 6. Recent Activity

**GET** `/api/analytics/recent-activity?limit=10`

**Query Parameters:**
- `limit` - Number of recent items (default: 10)

Returns recent incidents and user registrations.

### 7. Verification Statistics

**GET** `/api/analytics/verification-stats`

Returns:
- Total verified/rejected/pending incidents
- Average verification time in hours

---

## 🚀 Quick Start Guide

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Seed Users:**
   ```bash
   npm run seed:users
   ```

3. **Seed Sample Data (Optional):**
   ```bash
   npm run seed:data
   ```

4. **Configure Email (Optional):**
   Add email configuration to `.env` file

5. **Start Server:**
   ```bash
   npm run dev
   ```

6. **Test Endpoints:**
   - Use Postman to test all endpoints
   - Login as admin/moderator to access analytics
   - Test image uploads with multipart/form-data

---

## 📝 Notes

- Image uploads are stored locally. For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- Email notifications are optional and won't break the system if not configured
- All analytics endpoints require moderator/admin role
- Location-based search uses MongoDB geospatial queries
- Search is case-insensitive and uses regex matching

