### To start server

```
npm run dev
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
