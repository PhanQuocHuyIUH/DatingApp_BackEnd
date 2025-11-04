### To start server

```
npm run dev
```

### ✅ PHASE 3: USER PROFILE

```
12. src/config/cloudinary.js               # Upload config
13. src/middleware/upload.middleware.js    # Multer
14. src/controllers/user.controller.js     # Get/Update profile
15. src/routes/user.routes.js              # User endpoints
16. Test: GET /api/users/me, PUT /api/users/me
```

### ✅ PHASE 4: DISCOVERY (Swipe)

```
17. src/models/Swipe.js                    # Swipe history schema
18. src/services/matching.service.js       # Filter profiles by location/age
19. src/controllers/discovery.controller.js # Get profiles, swipe left/right
20. src/routes/discovery.routes.js         # Discovery endpoints
21. Test: GET /api/discovery/profiles, POST /api/discovery/swipe
```

### ✅ PHASE 5: MATCHES

```
22. src/models/Match.js                    # Match schema
23. src/controllers/match.controller.js    # Get matches, unmatch
24. src/routes/match.routes.js             # Match endpoints
25. Test: GET /api/matches
```

### ✅ PHASE 6: CHAT (Real-time)

```
26. src/models/Message.js                  # Message schema
27. src/controllers/chat.controller.js     # Get conversations, messages
28. src/routes/chat.routes.js              # Chat endpoints
29. src/socket/index.js                    # Socket.IO for real-time
30. Test: GET /api/chats, Socket.IO connection
```

### ✅ PHASE 7: NOTIFICATIONS (Optional)

```
31. src/services/notification.service.js   # Expo push notifications
```

## 🎯 ROADMAP CHO TỪNG SCREEN

| Screen                       | Backend API cần                                            | Priority      |
| ---------------------------- | ---------------------------------------------------------- | ------------- |
| **Screen 3: Login**          | `POST /api/auth/login`, `/api/auth/register`               | 🔴 Cao        |
| **Screen 6: Swipe**          | `GET /api/discovery/profiles`, `POST /api/discovery/swipe` | 🔴 Cao        |
| **Screen 8: Profile Detail** | `GET /api/users/:id`                                       | 🟡 Trung bình |
| **Screen 10: Filters**       | `PUT /api/users/preferences`                               | 🟢 Thấp       |
| **Screen 13: Matches**       | `GET /api/matches`                                         | 🔴 Cao        |
| **Screen 12: Chat**          | `GET /api/chats/:id/messages`, Socket.IO                   | 🔴 Cao        |
| **Screen 7: Video Call**     | WebRTC/Agora token API                                     | 🟢 Thấp       |
| **Screen 4: Profile**        | `GET /api/users/me`                                        | 🟡 Trung bình |
| **Screen 9: Edit Profile**   | `PUT /api/users/me`, `POST /api/upload`                    | 🟡 Trung bình |

---
