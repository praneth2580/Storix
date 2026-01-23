# Google Sheets API with OAuth Setup Guide

This project has been migrated from Google Apps Script (JSONP) to Google Sheets API v4 with OAuth 2.0 authentication.

## Prerequisites

1. A Google Cloud Project
2. Google Sheets API enabled
3. OAuth 2.0 credentials configured

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in the required information
   - Add scopes: `https://www.googleapis.com/auth/spreadsheets`
   - Add test users (if in testing mode)
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Storix Inventory"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Your production domain
5. Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

### 3. Configure Environment Variables

1. Create a `.env` file in the project root (or copy from `.env.example`):
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

2. Replace `your-client-id.apps.googleusercontent.com` with your actual Client ID

### 4. Share Google Sheet with OAuth Account

1. Open your Google Sheet (ID: `1YWCKAwAkKiMkWI3ZEh2PUMiq9PNmgr5biMR6ECywrek`)
2. Click "Share" button
3. Add the Google account email that will be used for OAuth
4. Give "Editor" permissions
5. Click "Send"

**Important**: The Google account used for OAuth must have access to the spreadsheet, otherwise API calls will fail with permission errors.

### 5. Run the Application

```bash
npm install
npm run dev
```

### 6. Login

1. Open the application in your browser
2. Enter your Google OAuth Client ID (or it will be loaded from environment variables)
3. Click "Initialize System"
4. You'll be redirected to Google's OAuth consent screen
5. Grant permissions to access Google Sheets
6. You'll be redirected back to the application, now authenticated

## How It Works

### Authentication Flow

1. User enters Client ID (or it's loaded from environment)
2. Google Identity Services library is loaded
3. User clicks "Initialize System"
4. OAuth consent screen appears
5. User grants permissions
6. Access token is received and stored
7. Token is used for all Google Sheets API requests

### API Requests

All API requests now use:
- **Endpoint**: `https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/...`
- **Authentication**: OAuth 2.0 Bearer token
- **Method**: Standard HTTP (GET, POST, PUT, DELETE)

### Token Management

- Tokens are automatically stored in `localStorage`
- Tokens are automatically refreshed when expired
- Tokens are revoked on logout

## Migration Notes

### What Changed

- **Backend**: No longer uses Google Apps Script
- **Authentication**: OAuth 2.0 instead of Script ID
- **API Calls**: Direct Google Sheets API v4 instead of JSONP
- **CORS**: No longer an issue (proper API with CORS headers)

### Backward Compatibility

- Legacy Script ID login is still available but deprecated
- All existing model functions work the same way
- The `jsonpRequest` function now uses Google Sheets API internally

### Features Preserved

- ✅ All CRUD operations (Create, Read, Update, Delete)
- ✅ Batch operations
- ✅ Reference resolution (`__REF(n).key__`)
- ✅ Multi-value filtering
- ✅ Foreign key relationships (enrichment handled in frontend if needed)

## Troubleshooting

### "Failed to initialize Google authentication"

- Check that `VITE_GOOGLE_CLIENT_ID` is set correctly
- Verify the Client ID format is correct
- Check browser console for detailed errors

### "Failed to fetch sheet data: 403"

- The Google account used for OAuth doesn't have access to the spreadsheet
- Share the spreadsheet with the OAuth account email
- Grant "Editor" permissions

### "Failed to fetch sheet data: 404"

- The sheet name doesn't exist
- Check that the sheet exists in the spreadsheet
- Sheet names are case-sensitive

### Token Expired

- Tokens automatically refresh, but if issues persist:
- Clear browser cache and localStorage
- Re-authenticate

## Security Notes

- **Never commit** `.env` file with real credentials
- Use environment variables in production
- OAuth tokens are stored in `localStorage` (consider more secure storage for production)
- The Client ID is safe to expose in frontend code (it's public)
- The access token should be kept secure

## Production Deployment

1. Set `VITE_GOOGLE_CLIENT_ID` in your hosting platform's environment variables
2. Add your production domain to OAuth authorized origins
3. Ensure the spreadsheet is shared with the production OAuth account
4. Test the OAuth flow in production

## Support

For issues or questions:
1. Check browser console for errors
2. Verify OAuth credentials are correct
3. Ensure spreadsheet permissions are set correctly
4. Check that Google Sheets API is enabled in your project
