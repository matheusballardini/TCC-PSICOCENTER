# API Endpoints Documentation

## Base URL
```
http://localhost:3001/api
```

---

## Auth Endpoints

### 1. Register
- **POST** `/auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role": "paciente" // or "psicologo"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Cadastro realizado com sucesso",
    "data": { "user": {...} }
  }
  ```

### 2. Login
- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Login realizado com sucesso",
    "data": {
      "user": {...},
      "token": "jwt-token"
    }
  }
  ```

### 3. Logout
- **POST** `/auth/logout`
- **Auth**: Required
- **Response**: `{ "success": true, "message": "Logout realizado com sucesso" }`

### 4. Forgot Password
- **POST** `/auth/forgot-password`
- **Body**: `{ "email": "user@example.com" }`
- **Response**: `{ "success": true, "message": "E-mail de recuperação enviado" }`

### 5. Refresh Token
- **POST** `/auth/refresh-token`
- **Body**: `{ "refresh_token": "token" }`

### 6. Get My Profile
- **GET** `/auth/me`
- **Auth**: Required
- **Response**: Returns user and profile data

---

## Pacientes Endpoints

### 1. List All Pacientes
- **GET** `/patients`
- **Auth**: Required (Admin only)

### 2. Get Paciente by ID
- **GET** `/patients/:id`
- **Auth**: Required

### 3. Update Paciente
- **PUT** `/patients/:id`
- **Auth**: Required (Own profile)
- **Body**: `{ "nome": "...", "bio": "...", ... }`

### 4. Get My Profile
- **GET** `/patients/me`
- **Auth**: Required

---

## Psicólogos Endpoints

### 1. List All Psicólogos
- **GET** `/psychologists`
- **Auth**: Required

### 2. Get Psicólogo by ID
- **GET** `/psychologists/:id`
- **Auth**: Required

### 3. Update Psicólogo
- **PUT** `/psychologists/:id`
- **Auth**: Required (Own profile)

### 4. Get Psicólogo Specialties
- **GET** `/psychologists/:id/specialties`
- **Auth**: Required

### 5. Add Specialty
- **POST** `/psychologists/:id/specialties`
- **Auth**: Required (Psychologist only)
- **Body**: `{ "specialtyId": "..." }`

### 6. Remove Specialty
- **DELETE** `/psychologists/:id/specialties`
- **Auth**: Required (Psychologist only)
- **Body**: `{ "specialtyId": "..." }`

### 7. Get Availability
- **GET** `/psychologists/:id/availability`

### 8. Set Availability
- **PUT** `/psychologists/:id/availability`
- **Auth**: Required (Psychologist only)
- **Body**: `{ "dias_disponiveis": [...], "horarios": [...] }`

### 9. Get Ratings
- **GET** `/psychologists/:id/ratings`

### 10. Create Rating
- **POST** `/psychologists/:id/ratings`
- **Auth**: Required
- **Body**: `{ "rating": 5, "comment": "..." }`

---

## Publicações Endpoints

### 1. List All Publicações
- **GET** `/publications`

### 2. Get Publicação by ID
- **GET** `/publications/:id`

### 3. Create Publicação
- **POST** `/publications`
- **Auth**: Required (Psychologist only)
- **Body**: `{ "title": "...", "content": "...", "image": "..." }`

### 4. Update Publicação
- **PUT** `/publications/:id`
- **Auth**: Required (Author only)

### 5. Delete Publicação
- **DELETE** `/publications/:id`
- **Auth**: Required (Author only)

### 6. Get Comments
- **GET** `/publications/:id/comments`

### 7. Add Comment
- **POST** `/publications/:id/comments`
- **Auth**: Required
- **Body**: `{ "content": "..." }`

### 8. Delete Comment
- **DELETE** `/publications/:id/comments/:commentId`
- **Auth**: Required (Comment author only)

### 9. Toggle Like
- **POST** `/publications/:id/like`
- **Auth**: Required

### 10. Toggle Save
- **POST** `/publications/:id/save`
- **Auth**: Required

### 11. Get My Saved Publicações
- **GET** `/publications/me/saved`
- **Auth**: Required

---

## Chat Endpoints

### 1. Create Conversation
- **POST** `/chats/conversations`
- **Auth**: Required
- **Body**: `{ "participant_two": "user_id" }`

### 2. List My Conversations
- **GET** `/chats/conversations`
- **Auth**: Required

### 3. Get Messages from Conversation
- **GET** `/chats/conversations/:conversationId/messages`
- **Auth**: Required

### 4. Send Message
- **POST** `/chats/conversations/:conversationId/messages`
- **Auth**: Required
- **Body**: `{ "content": "..." }`

### 5. Delete Message
- **DELETE** `/chats/conversations/:conversationId/messages/:messageId`
- **Auth**: Required (Message sender only)

### 6. Add Attachment to Message
- **POST** `/chats/messages/:messageId/attachments`
- **Auth**: Required
- **Body**: `{ "url": "...", "type": "image|video|audio|file" }`

### 7. Get Message Attachments
- **GET** `/chats/messages/:messageId/attachments`
- **Auth**: Required

---

## Appointments Endpoints

### 1. List All Appointments
- **GET** `/appointments`
- **Auth**: Required (Admin)

### 2. Get My Appointments
- **GET** `/appointments/me`
- **Auth**: Required

### 3. Get Appointment by ID
- **GET** `/appointments/:id`
- **Auth**: Required

### 4. Create Appointment
- **POST** `/appointments`
- **Auth**: Required (Patient)
- **Body**:
  ```json
  {
    "psicologo_id": "...",
    "data": "2026-12-15",
    "horario": "14:00"
  }
  ```

### 5. Update Appointment Status
- **PATCH** `/appointments/:id/status`
- **Auth**: Required (Psychologist/Admin)
- **Body**: `{ "status": "confirmada|cancelada|concluida" }`

### 6. Cancel Appointment
- **PATCH** `/appointments/:id/cancel`
- **Auth**: Required (Patient or Psychologist)

---

## Notifications Endpoints

### 1. List My Notifications
- **GET** `/notifications`
- **Auth**: Required

### 2. Get Notification by ID
- **GET** `/notifications/:id`
- **Auth**: Required

### 3. Mark as Read
- **PATCH** `/notifications/:id/read`
- **Auth**: Required

### 4. Mark All as Read
- **PATCH** `/notifications/mark-all-read`
- **Auth**: Required

### 5. Delete Notification
- **DELETE** `/notifications/:id`
- **Auth**: Required

---

## Reports Endpoints

### 1. Create Report
- **POST** `/reports`
- **Auth**: Required
- **Body**:
  ```json
  {
    "reported_user_id": "...",
    "reason": "spam|harassment|inappropriate|other",
    "description": "..."
  }
  ```

### 2. List All Reports
- **GET** `/reports`
- **Auth**: Required (Admin only)

### 3. Get My Reports
- **GET** `/reports/me`
- **Auth**: Required

### 4. Get Report by ID
- **GET** `/reports/:id`
- **Auth**: Required (Admin only)

### 5. Update Report Status
- **PATCH** `/reports/:id/status`
- **Auth**: Required (Admin only)
- **Body**: `{ "status": "pendente|investigando|resolvido|rejeitado" }`

### 6. Delete Report
- **DELETE** `/reports/:id`
- **Auth**: Required (Admin only)

---

## Followers Endpoints

### 1. Follow User
- **POST** `/users/:userId/follow`
- **Auth**: Required

### 2. Unfollow User
- **DELETE** `/users/:userId/follow`
- **Auth**: Required

### 3. Get User Followers
- **GET** `/users/:userId/followers`

### 4. Get User Following
- **GET** `/users/:userId/following`

### 5. Get Follower Count
- **GET** `/users/:userId/followers/count`

### 6. Get Following Count
- **GET** `/users/:userId/following/count`

### 7. Check if Following
- **GET** `/users/:userId/is-following`
- **Auth**: Required

---

## Especialidades Endpoints

### 1. List All Especialidades
- **GET** `/especialidades`

### 2. Get Especialidade by ID
- **GET** `/especialidades/:id`

---

## Upload Endpoints

### 1. Upload File
- **POST** `/upload`
- **Auth**: Required
- **Content-Type**: multipart/form-data
- **Fields**:
  - `file` (required): File to upload
  - `bucket` (optional): Bucket name (default: 'documents')
  - `folder` (optional): Folder path inside bucket

---

## Authentication

All endpoints that require authentication must include:
```
Authorization: Bearer <jwt-token>
```

The token is obtained from the `/auth/login` endpoint and included in all requests that have "Auth: Required".

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Description of what happened",
  "data": {
    "...": "response data"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "...": "error details"
  }
}
```

---

## Notes

- All dates should be in ISO 8601 format: `YYYY-MM-DD`
- All times should be in 24-hour format: `HH:MM`
- JWT tokens expire after 7 days
- Rate limit: 100 requests per 15 minutes
- Max request body size: 10MB
