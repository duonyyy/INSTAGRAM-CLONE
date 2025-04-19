# Instagram Clone

A full-stack social media application mimicking core features of Instagram, built with modern web technologies. This project includes user authentication, post creation, real-time messaging, and media uploads, containerized with Docker for easy deployment.

## Table of Contents

- [Instagram Clone](#instagram-clone)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technologies](#technologies)
  - [Prerequisites](#prerequisites)
  - [Project Structure](#project-structure)
  - [Setup Instructions](#setup-instructions)
    - [1. Clone the Repository](#1-clone-the-repository)
    - [2. Configure Environment Variables](#2-configure-environment-variables)
      - [Backend](#backend)
      - [Frontend](#frontend)
      - [Docker Compose](#docker-compose)
    - [3. Verify Docker Installation](#3-verify-docker-installation)
  - [Running the Application](#running-the-application)
    - [Using Docker](#using-docker)
    - [Without Docker (Development Mode)](#without-docker-development-mode)
  - [API Endpoints](#api-endpoints)
  - [Troubleshooting](#troubleshooting)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- User registration and login with JWT authentication.
- Create, view, like, and comment on posts.
- Real-time messaging using Socket.io.
- Image uploads powered by Cloudinary.
- Responsive frontend with React and Vite.
- Containerized deployment with Docker and Docker Compose.

## Technologies

- **Frontend**: React, Vite, Axios, Socket.io-client
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io, Bcryptjs, Jsonwebtoken, Cloudinary
- **Database**: MongoDB
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (for serving frontend)
- **Environment**: `.env` for configuration

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 1.29 or higher)
- Node.js (optional, for running outside Docker)
- A [Cloudinary account](https://cloudinary.com/users/register/free) for media uploads
- Git (for cloning the repository)

## Project Structure

```
instagram-clone/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── socket/
│   │   └── index.js
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api.js
│   │   └── ...
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
├── docker-compose.example.yml
├── .gitignore
└── README.md
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your_username/instagram-clone.git
cd instagram-clone
```

### 2. Configure Environment Variables

#### Backend

- Copy `backend/.env.example` to `backend/.env`:
  ```bash
  cp backend/.env.example backend/.env
  ```
- Edit `backend/.env` with your values:
  ```env
  PORT=8080
  MONGO_URL=mongodb://localhost:27017/instagram_clone
  SECRET_KEY=your_jwt_secret
  API_KEY=your_cloudinary_api_key
  API_SECRET=your_cloudinary_api_secret
  CLOUD_NAME=your_cloudinary_cloud_name
  ```
- Generate a secure `SECRET_KEY`:
  ```bash
  openssl rand -base64 32
  ```
- Obtain `API_KEY`, `API_SECRET`, and `CLOUD_NAME` from your [Cloudinary dashboard](https://cloudinary.com/console).

#### Frontend

- Copy `frontend/.env.example` to `frontend/.env`:
  ```bash
  cp frontend/.env.example frontend/.env
  ```
- Edit `frontend/.env`:
  ```env
  VITE_API_URL=http://localhost:8080
  VITE_WS_URL=http://localhost:8080
  ```

#### Docker Compose

- Copy `docker-compose.example.yml` to `docker-compose.yml`:
  ```bash
  cp docker-compose.example.yml docker-compose.yml
  ```
- Edit `docker-compose.yml` to replace placeholder values (`your_jwt_secret`, `your_cloudinary_api_key`, etc.) with the same values from `backend/.env`.

### 3. Verify Docker Installation

```bash
docker --version
docker-compose --version
```

## Running the Application

### Using Docker

1. Build and start the containers:

   ```bash
   docker-compose up --build
   ```

   - This starts three services: `backend` (Node.js on port 8080), `frontend` (Nginx on port 80), and `db` (MongoDB on port 27017).
   - Use `-d` for detached mode: `docker-compose up --build -d`.

2. Access the application:

   - **Frontend**: Open [http://localhost](http://localhost) in your browser.
   - **Backend**: Test with [http://localhost:8080/](http://localhost:8080/) (returns `{"message": "Hello, Express!", "success": true}`).
   - **MongoDB**: Connect to `localhost:27017` using MongoDB Compass or a MongoDB client.

3. Stop the containers:
   ```bash
   docker-compose down
   ```

### Without Docker (Development Mode)

1. **Backend**:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   - Requires MongoDB running locally (`mongod`).

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Opens at [http://localhost:5173](http://localhost:5173).

## API Endpoints

- **Register a User**:

  ```bash
  curl -X POST http://localhost:8080/api/v1/user/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
  ```

- **Login**:

  ```bash
  curl -X POST http://localhost:8080/api/v1/user/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
  ```

- **Other Endpoints**:
  - `/api/v1/post`: Create, read, update, delete posts.
  - `/api/v1/message`: Send and receive messages (real-time via Socket.io).
  - See `backend/routes/` for detailed routes.

## Troubleshooting

- **Error: "Incorrect email or password"**:

  - Check if the user exists in MongoDB:
    ```bash
    docker exec -it instagramclone-db-1 mongosh
    use instagram_clone
    db.users.find()
    ```
  - Register a user if the database is empty (see API Endpoints).
  - Verify password hashing in `backend/models/User.js`.

- **CORS Issues**:

  - Ensure `corsOptions` in `backend/index.js` allows `http://localhost` and `http://localhost:5173`.
  - Check browser DevTools (Network tab) for CORS errors.

- **MongoDB Connection Failed**:

  - Verify `MONGO_URL` in `backend/.env` or `docker-compose.yml`.
  - Check MongoDB logs:
    ```bash
    docker-compose logs db
    ```

- **Socket.io Not Connecting**:

  - Confirm `VITE_WS_URL` in `frontend/.env`.
  - Check backend logs for `A user connected`.

- **Nginx 404 on Refresh**:
  - Verify `nginx.conf` has `try_files $uri $uri/ /index.html`.

For detailed logs:

```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
