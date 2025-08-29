# Tender Management System (TMS)

A comprehensive tender management system built with Next.js, Express.js, Prisma, PostgreSQL, and MinIO for file storage.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with App Router, TypeScript, and Tailwind CSS
- **Backend API**: Express.js with TypeScript and ESM modules
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: MinIO (S3-compatible)
- **Authentication**: JWT-based with role-based access control
- **Monorepo**: NPM workspaces for shared packages

## 🎯 Features

### Pre-Site Management
- **Project Management**: Create and manage construction projects
- **Bio Data Management**: Contractor, Client, and Consultant information
- **Bill of Quantities**: Priced and unpriced BOQ management
- **Market Survey**: Procurement planning with item comparison
- **Supplier Management**: Comprehensive supplier registry and comparison
- **Sample Approval Workflow**: Supplier → Site Engineer → Office approval
- **Purchasing Plans**: Bank and creditor management

### Site Operations
- **Inventory Management**: Site and office inventory tracking
- **Order Management**: Site requests with office verification
- **Delivery Management**: Document stamping and re-upload workflow
- **Tools & Equipment**: Daily usage tracking and management

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18.0 or higher
- Docker and Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd TMS
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services
```bash
# Start PostgreSQL and MinIO
docker compose up -d

# Generate Prisma client
npm -w packages/db run generate

# Build shared packages
npm -w packages/db run build
```

### 4. Run Development Servers
```bash
# Terminal 1: API Server
npm run dev:api

# Terminal 2: Web Application
npm run dev
```

## 📁 Project Structure

```
TMS/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Express.js API
├── packages/
│   └── db/                  # Prisma database package
├── docker-compose.yml       # PostgreSQL + MinIO services
├── .env.example            # Environment configuration
└── README.md               # This file
```

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start Next.js development server
- `npm run dev:api` - Start Express API development server
- `npm run build` - Build all packages and applications
- `npm run lint` - Lint all packages

### API Package
- `npm run dev` - Start API with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production API server

### Database Package
- `npm run generate` - Generate Prisma client
- `npm run migrate` - Run database migrations
- `npm run studio` - Open Prisma Studio
- `npm run build` - Build TypeScript package

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - API health status

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## 🗄️ Database Schema

### Core Models
- **User**: System users with role-based access
- **Project**: Construction projects and metadata
- **Party**: Contractors, clients, consultants
- **BOQ**: Bill of quantities with pricing
- **Supplier**: Vendor registry and ratings
- **Inventory**: Material and equipment tracking

## 🔐 Authentication & Authorization

### User Roles
- **Site Supervisor**: Site operations and inventory
- **Procurement**: Supplier management and purchasing
- **Supplier**: Quote submission and delivery
- **Chairman**: Approvals and oversight
- **Chairman's PA**: Document management and routing

### Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Field-level data permissions
- Audit logging for all changes

## 📁 File Storage

### MinIO Configuration
- **Endpoint**: localhost:9000
- **Console**: localhost:9001
- **Default Bucket**: tms-files
- **Access Control**: Role-based bucket policies

### Supported File Types
- Documents (PDF, DOC, DOCX)
- Images (JPG, PNG, GIF)
- CAD files (DWG, DXF)
- Spreadsheets (XLS, XLSX, CSV)

## 🚀 Deployment

### Production Build
```bash
npm run build
npm -w apps/api run start
npm -w apps/web run start
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `MINIO_ENDPOINT`: MinIO server endpoint
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment (development/production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions, please contact the development team.
