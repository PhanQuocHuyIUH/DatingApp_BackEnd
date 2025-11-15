// const { Expo } = require("expo-server-sdk");

// // Create Expo SDK client
// const expo = new Expo();

// /**
//  * Send push notification to a user
//  * @param {string} pushToken - Expo push token
//  * @param {object} notification - Notification data
//  * @returns {Promise}
//  */
// const sendPushNotification = async (pushToken, notification) => {
//   try {
//     // Check if token is valid
//     if (!Expo.isExpoPushToken(pushToken)) {
//       console.error(`❌ Invalid Expo push token: ${pushToken}`);
//       return;
//     }

//     // Prepare message
//     const message = {
//       to: pushToken,
//       sound: "default",
//       title: notification.title,
//       body: notification.body,
//       data: notification.data || {},
//       badge: notification.badge || 1,
//       priority: notification.priority || "high",
//       channelId: notification.channelId || "default",
//     };

//     // Send notification
//     const ticketChunk = await expo.sendPushNotificationsAsync([message]);
//     console.log("✅ Push notification sent:", ticketChunk);

//     return ticketChunk[0];
//   } catch (error) {
//     console.error("❌ Send push notification error:", error);
//     throw error;
//   }
// };

// /**
//  * Send push notifications to multiple users
//  * @param {array} notifications - Array of { pushToken, notification }
//  * @returns {Promise}
//  */
// const sendBatchPushNotifications = async (notifications) => {
//   try {
//     const messages = [];

//     for (const notif of notifications) {
//       if (!Expo.isExpoPushToken(notif.pushToken)) {
//         console.warn(`⚠️ Invalid token, skipping: ${notif.pushToken}`);
//         continue;
//       }

//       messages.push({
//         to: notif.pushToken,
//         sound: "default",
//         title: notif.notification.title,
//         body: notif.notification.body,
//         data: notif.notification.data || {},
//         badge: notif.notification.badge || 1,
//       });
//     }

//     // Chunk messages (max 100 per request)
//     const chunks = expo.chunkPushNotifications(messages);
//     const tickets = [];

//     for (const chunk of chunks) {
//       const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//       tickets.push(...ticketChunk);
//     }

//     console.log(`✅ Sent ${tickets.length} push notifications`);
//     return tickets;
//   } catch (error) {
//     console.error("❌ Send batch push notifications error:", error);
//     throw error;
//   }
// };

// /**
//  * Send "New Match" notification
//  * @param {string} pushToken - Receiver's push token
//  * @param {object} matchUser - User who matched
//  */
// const sendMatchNotification = async (pushToken, matchUser) => {
//   return await sendPushNotification(pushToken, {
//     title: "💕 New Match!",
//     body: `You matched with ${matchUser.name}!`,
//     data: {
//       type: "match",
//       userId: matchUser.id,
//       screen: "Matches",
//     },
//     badge: 1,
//   });
// };

// /**
//  * Send "New Message" notification
//  * @param {string} pushToken - Receiver's push token
//  * @param {object} sender - Message sender
//  * @param {string} messageText - Message content
//  */
// const sendMessageNotification = async (pushToken, sender, messageText) => {
//   return await sendPushNotification(pushToken, {
//     title: `💬 ${sender.name}`,
//     body: messageText || "Sent you a message",
//     data: {
//       type: "message",
//       userId: sender.id,
//       conversationId: sender.conversationId,
//       screen: "Chat",
//     },
//     badge: 1,
//   });
// };

// /**
//  * Send "New Like" notification
//  * @param {string} pushToken - Receiver's push token
//  * @param {object} liker - User who liked
//  */
// const sendLikeNotification = async (pushToken, liker) => {
//   return await sendPushNotification(pushToken, {
//     title: "❤️ Someone likes you!",
//     body: `${liker.name} swiped right on you`,
//     data: {
//       type: "like",
//       userId: liker.id,
//       screen: "Likes",
//     },
//     badge: 1,
//   });
// };

// /**
//  * Send "Super Like" notification
//  * @param {string} pushToken - Receiver's push token
//  * @param {object} superLiker - User who super liked
//  */
// const sendSuperLikeNotification = async (pushToken, superLiker) => {
//   return await sendPushNotification(pushToken, {
//     title: "⭐ Super Like!",
//     body: `${superLiker.name} super liked you!`,
//     data: {
//       type: "superlike",
//       userId: superLiker.id,
//       screen: "Likes",
//     },
//     badge: 1,
//   });
// };

// /**
//  * Check notification receipts
//  * @param {array} tickets - Array of ticket IDs
//  */
// const checkNotificationReceipts = async (tickets) => {
//   try {
//     const receiptIds = tickets.map((ticket) => ticket.id);
//     const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

//     for (const chunk of receiptIdChunks) {
//       const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

//       for (const receiptId in receipts) {
//         const receipt = receipts[receiptId];

//         if (receipt.status === "ok") {
//           console.log("✅ Notification delivered:", receiptId);
//         } else if (receipt.status === "error") {
//           console.error("❌ Notification error:", receipt.message);

//           // Handle errors (e.g., invalid token)
//           if (receipt.details?.error === "DeviceNotRegistered") {
//             // Remove invalid push token from database
//             console.warn("⚠️ Device not registered, should remove token");
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("❌ Check receipts error:", error);
//   }
// };

// module.exports = {
//   sendPushNotification,
//   sendBatchPushNotifications,
//   sendMatchNotification,
//   sendMessageNotification,
//   sendLikeNotification,
//   sendSuperLikeNotification,
//   checkNotificationReceipts,
// };
