# DevOps_Oct2025_Team3_Assignment

## Developer Guide
This guide will help you clone, set up, and deploy the MVP SecureApp project.

---

## 1. Clone and Setup the Project

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Docker Engine**(for Linux) or **Docker Desktop**(for Windows/Mac)
- **Git**
- **MongoDB Atlas account** (or local MongoDB instance)

### Step 1: Clone the Repository
```bash
git clone https://github.com/DevOps-Oct2025-Team3/DevOps_Oct2025_Team3_Assignment.git

cd DevOps_Oct2025_Team3_Assignment
```

### Step 2: Install Dependencies
Install all required npm packages:
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the backend folder with the following variables:
```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Secret (use a strong random string)
JWT_SECRET=your-secure-jwt-secret-key

```

**Note**: Replace `<username>`, `<password>`, and `<database>` with your MongoDB Atlas credentials.

### Step 4: Verify Project Structure
Ensure your project structure looks like this:
```
DevOps_Oct2025_Team3_Assignment/
├── backendserver/
│   ├── .env
│   ├── docker-compose.yml
│   └── users/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── tests/
│       ├── app.js
│       ├── dbConfig.js
│       ├── Dockerfile
│       ├── package-lock.json
│       └── package.json
├── frontend/
│   ├── index.html
│   └── js/
│       └── frontend.js
├── .dockerignore
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

### Step 5: Run Tests
Before running the application, verify all tests pass:
```bash
npm test
```

Expected output: All 22+ tests should pass (user model + controller tests).

### Step 6: Run the Application Locally

#### Option A: Using Node.js directly
```bash
npm start
```
The server will start on `http://localhost:4001`

#### Option B: Using Docker Compose
```bash
docker compose up --build
```
This will:
- Build the Docker images
- Start the backend service on port 4001
- Connect to MongoDB Atlas

**Note**: Make sure **Docker Desktop/Engine** is running. \
Run ```docker compose down ``` to stop and remove containers created from ```docker compose up```

### Step 7: Access the Application
Open your browser and navigate to:
```
file:///path/to/DevOps_Oct2025_Team3_Assignment/frontend/index.html
```
Or serve the frontend using a local web server:
```bash
# Using Python 3
cd frontend
python -m http.server 8080

# Then open http://localhost:8080
```

### Default Login Credentials
- **Admin Account**: Create via API or database
  - Username: `admin`
  - Password: Must meet criteria (8+ chars, 1 uppercase, 1 lowercase, 1 number)

---

## 2. CI/CD Pipeline Setup and Execution

### Overview
This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD).

### Prerequisites for CI/CD
- GitHub repository with appropriate permissions
- MongoDB Atlas cluster for production
- Docker Hub account (or other container registry)
- Secrets configured in GitHub repository settings

### Step 1: Configure GitHub Secrets
Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**, then add:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT signing secret | `super-secret-jwt-key-2026` |
| `DOCKER_USERNAME` | Docker Hub username | `yourdockerhubuser` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `dckr_pat_xxxxx` |

### Step 2: Create GitHub Actions Workflow
Create `.github/workflows/ci-cd.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: npm test
      env:
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
        MONGODB_URI: ${{ secrets.MONGODB_URI }}

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Docker image
      run: |
        docker build -t ${{ secrets.DOCKER_USERNAME }}/mvp-secureapp:latest ./backendserver/users
        docker push ${{ secrets.DOCKER_USERNAME }}/mvp-secureapp:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deployment step - configure based on your hosting platform"
        # Add deployment commands here (e.g., SSH to server, kubectl apply, etc.)
```

### Step 3: Trigger the Pipeline

#### Automatic Trigger
The pipeline automatically runs on:
- **Push to main branch**: Runs tests, builds Docker image, and deploys
- **Push to develop branch**: Runs tests only
- **Pull requests to main**: Runs tests only

#### Manual Trigger
1. Go to **Actions** tab in your GitHub repository
2. Select the **CI/CD Pipeline** workflow
3. Click **Run workflow**
4. Choose the branch and click **Run workflow** button

### Step 4: Monitor Pipeline Execution
1. Navigate to the **Actions** tab in your GitHub repository
2. Click on the latest workflow run
3. View the progress of each job:
   - ✅ **Test Job**: Runs unit tests
   - ✅ **Build Job**: Creates and pushes Docker image
   - ✅ **Deploy Job**: Deploys to production

### Step 5: Verify Deployment
After successful pipeline execution:

1. **Check Docker Hub**: Verify the image was pushed
   ```bash
   docker pull <your-dockerhub-username>/mvp-secureapp:latest
   ```

2. **Test the deployed application**:
   ```bash
   curl http://your-production-url:4001/health
   ```

3. **View logs** (if deployed on a server):
   ```bash
   docker logs <container-id>
   ```

### Pipeline Stages Explained

#### Stage 1: Test
- Checks out code
- Installs dependencies
- Runs Jest unit tests
- Fails if any test fails

#### Stage 2: Build
- Only runs if tests pass and on `main` branch
- Builds Docker image from `backendserver/users/Dockerfile`
- Tags image with `latest`
- Pushes to Docker Hub

#### Stage 3: Deploy
- Only runs if build succeeds
- Deploys the application to production environment
- Can be customized for various platforms (AWS, Azure, GCP, etc.)

### Troubleshooting CI/CD Issues

**Tests Failing**:
```bash
# Run tests locally to debug
npm test -- --verbose
```

**Docker Build Failing**:
```bash
# Test Docker build locally
cd backendserver/users
docker build -t test-image .
```

**Secrets Not Working**:
- Verify secrets are set in GitHub repository settings
- Check secret names match exactly (case-sensitive)
- Re-create secrets if needed

**Deployment Issues**:
- Check deployment logs in Actions tab
- Verify server/platform credentials
- Ensure network connectivity and firewall rules

---

## Additional Resources

### Running Tests with Coverage
```bash
npm test -- --coverage
```

### Development Mode (Auto-reload)
```bash
npm run dev
```

### Stopping Docker Containers
```bash
docker-compose down
```

### Viewing Docker Logs
```bash
docker-compose logs -f
```

### Database Connection Test
```bash
# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"
```

---

## Project Architecture

- **Frontend**: Vanilla JavaScript with Bootstrap 5
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with 1-hour expiration
- **Testing**: Jest with module mocking
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

---

## Contact & Support

For issues or questions:
1. Check existing GitHub Issues
2. Create a new issue with detailed description
3. Contact the development team

---

**Last Updated**: February 2026