# MongoDB Atlas Migration Guide

This guide will help you migrate your local MongoDB data to MongoDB Atlas (MongoDB's cloud service).

## Step 1: Create a MongoDB Atlas Account & Cluster

### 1.1 Sign Up for MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and create an account
3. Verify your email

### 1.2 Create a New Project
1. In the dashboard, click "Create a new project"
2. Name it "MadadKaro"
3. Click "Create Project"

### 1.3 Create a Cluster
1. Click "Create a Deployment"
2. Select **M0 Free** tier (free forever, perfect for development)
3. Choose your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Select a region close to your location
5. Click "Create Deployment"
6. Wait for the cluster to be created (2-3 minutes)

### 1.4 Create a Database User
1. In the left sidebar, go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set Username: `madadkaro-user` (or any username)
5. Set Password: Generate a strong password (or create your own)
6. Set Privilege: "Built-in role: Atlas admin" 
7. Click "Add User"
8. **Save your username and password securely**

### 1.5 Whitelist Your IP Address
1. In the left sidebar, go to "Network Access"
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, use your actual IP address
4. Click "Confirm"

### 1.6 Get Your Connection String
1. Go to "Databases" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "MongoDB for VS Code" or "MongoDB Shell"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your actual credentials

Example connection string:
```
mongodb+srv://madadkaro-user:YourPassword123@cluster0.xxxxx.mongodb.net/madadkaro?retryWrites=true&w=majority
```

---

## Step 2: Export Local MongoDB Data

### 2.1 Check Your Local MongoDB Status
Open PowerShell or Command Prompt and run:
```powershell
# Check if MongoDB is running
Get-Process mongod -ErrorAction SilentlyContinue
```

### 2.2 Export Your Data
Replace `madadkaro` with your actual database name:
```powershell
# Export entire database to JSON
mongodump --db madadkaro --out ./mongodb-backup

# Or export as BSON (binary format)
mongodump --db madadkaro --out ./mongodb-backup
```

**Output location:**
- Files will be in `./mongodb-backup/madadkaro/` folder
- Each collection will be in a separate JSON/BSON file

### 2.3 Verify Export
```powershell
# Check the backup folder
Get-ChildItem ./mongodb-backup/madadkaro/

# You should see files like:
# - users.bson, users.json
# - tasks.bson, tasks.json
# - bids.bson, bids.json
# etc.
```

---

## Step 3: Import Data to MongoDB Atlas

### 3.1 Using MongoDB Atlas Web Interface
1. Go to "Databases" in MongoDB Atlas
2. Click your cluster name
3. Click "Collections"
4. Click "Import Data"
5. Upload your exported BSON files
6. Follow the wizard to complete import

### 3.2 Using mongorestore (Command Line)
```powershell
# Restore from BSON files
mongorestore `
  --uri="mongodb+srv://madadkaro-user:YourPassword123@cluster0.xxxxx.mongodb.net/madadkaro" `
  ./mongodb-backup
```

**Note:** mongorestore preserves the exact database name and structure.

---

## Step 4: Update Your Application Configuration

### 4.1 Create/Update .env File
In `madadkaro-backend/.env`, add:

```env
# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://madadkaro-user:YourPassword123@cluster0.xxxxx.mongodb.net/madadkaro?retryWrites=true&w=majority

# Keep other variables
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
PORT=5000
CLIENT_URL=http://localhost:3000
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

### 4.2 Verify Connection
Restart your backend server:
```powershell
# In madadkaro-backend folder
npm run dev
```

You should see in the console:
```
MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

## Step 5: Verify Data Migration

### 5.1 Check Data in Atlas Web Interface
1. Go to "Databases" → Your Cluster → "Collections"
2. You should see all your collections (users, tasks, bids, etc.)
3. Click on each collection to verify data was imported

### 5.2 Verify via Application
1. Start your backend: `npm run dev`
2. Start your frontend: `npm run dev` (in frontend folder)
3. Test these features:
   - Login with existing user
   - Create a new task
   - Place a bid
   - Send a message
   - All operations should work normally

### 5.3 Check MongoDB Atlas Logs
1. Go to "Activity Feed" to see import/export operations
2. Check "Deployment" metrics to see connection activity

---

## Step 6: Cleanup (Optional)

Once you've verified everything works:

```powershell
# You can remove the local backup
Remove-Item ./mongodb-backup -Recurse -Force

# Keep your local MongoDB for development if needed
# Stop local MongoDB if you're only using Atlas:
Stop-Service MongoDB -Force
```

---

## Troubleshooting

### Connection Fails: "Authentication failed"
- Verify username and password in connection string
- Check IP address is whitelisted in Network Access
- Ensure `retryWrites=true&w=majority` is in connection string

### Connection Fails: "Timeout"
- Check internet connection
- Verify your IP is whitelisted
- Try whitelisting 0.0.0.0/0 temporarily

### Data Not Showing After Import
- Check collection names match exactly
- Verify the import completed successfully
- Check Atlas Activity Feed for errors

### Need to Re-Import
```powershell
# Delete all collections and re-import
# In MongoDB Atlas: Click cluster → Collections → Delete Database → Confirm
# Then run import again
```

---

## Performance Tips for Atlas M0 Free Tier

- Keep database size under 512 MB
- Avoid large bulk operations during peak hours
- Use indexed queries for better performance
- Consider upgrading to M2+ if you need more capacity

---

## Switching Back to Local (If Needed)

To switch back to local MongoDB:
1. Update `.env` with: `MONGO_URI=mongodb://localhost:27017/madadkaro`
2. Start your local MongoDB server
3. Restart your application

---

## Support

If you encounter issues:
1. Check [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
2. Review [MongoDB Troubleshooting Guide](https://docs.mongodb.com/manual/faq/diagnostics/)
3. Check your browser console and server logs for errors
