# Chat Application Based on ChatGPT - Monta AI Backend Task

This is a NestJS-based backend system that uses the GPT-4o API to power a secure, session-managed chat application. The system includes user authentication with JWT and refresh tokens, and it stores user sessions and chat histories in MongoDB.

## Table of Contents
- [Description](#description)
- [Technologies](#technologies)
- [Why Nest.js](#why-nestjs)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Security](#security)
- [License](#license)

## Description

This project leverages the NestJS framework to create a robust backend system for a chat application. The backend interfaces with the GPT-4o API to provide intelligent chat responses. Users can register, log in, and maintain chat sessions, with JWT-based authentication and refresh tokens ensuring secure access.

## Technologies

- **NestJS**: A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- **MongoDB**: A NoSQL database for storing user data and chat sessions.
- **JWT (JSON Web Tokens)**: Used for secure user authentication and authorization.
- **Passport.js**: Middleware for authentication, integrated with JWT for stateless sessions.
- **Rate Limiter**: Built-in @Throttler for rate limiting requests that try to abuse the server.


## Why NestJS?

NestJS was chosen for this project due to its following advantages:

- **Modularity**: Allows for a modular architecture, making it easier to manage and scale the application.
- **TypeScript Support**: Provides strong typing and modern JavaScript features.
- **Dependency Injection**: Simplifies the management of dependencies.
- **Built-in Support for Authentication and Authorization**: Seamlessly integrates with Passport.js for handling authentication.
- **Robust CLI**: Provides a robust CLI to create and manage various aspects of the application.

## Installation

To set up the project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/chat-app-backend.git
   cd chat-app-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following variables:
   ```plaintext
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   MONGO_URI=mongodb://admin:admin@localhost:27017/?authSource=admin
   
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MAX_TOKENS=150
   OPENAI_MODEL=gpt-4o
   
   THROTTLE_TTL=60000
   THROTTLE_LIMIT=10
   ```

## Running the Application

To start the application, use the following command:

```bash
npm run start:dev
```

The application will run on `http://localhost:3000`.

## Deployment

The project has been deployed to DigitalOcean App Platform, as I already have an account there. 
But in anycase the solution is Dockerized so it can run anywhere :)

## Security

### Authentication and Authorization

The backend uses JWT for authentication and authorization. Here's how we secured the backend:

- **JWT Access Tokens**: Used for verifying user identity and granting access to protected endpoints.
- **JWT Refresh Tokens**: Used to issue new access tokens without requiring the user to log in again.

### Guards

We implemented custom guards to protect endpoints:

- **LocalAuthGuard**: Used for login, validating the user's credentials.
- **JwtAuthGuard**: Protects routes by verifying the JWT access token.
- **JwtRefreshGuard**: Protects the refresh token endpoint, validating the JWT refresh token.

### Example Guards Implementation

**`local-auth.guard.ts`**:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor() {
    super({ session: false });
  }
}
```

**`jwt-auth.guard.ts`**:
```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

**`jwt-refresh.guard.ts`**:
```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```
### Rate Limiting

#### Importance of Rate Limiting

Rate limiting is crucial for preventing abuse and ensuring the stability and performance of the backend system. It helps protect the application from excessive requests that could lead to denial of service or degraded performance.

#### Usage of @nestjs/throttler

We have integrated @nestjs/throttler to handle rate limiting in our NestJS application. This ensures that each user is limited to a certain number of requests within a specified time frame.
