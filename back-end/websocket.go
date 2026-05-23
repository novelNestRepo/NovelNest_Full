package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

type Client struct {
	Conn  *websocket.Conn
	User  User
	Rooms map[string]bool
}

var clients = make(map[string]*Client)
var rooms = make(map[string]map[string]bool)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	tokenString := c.Query("token")
	if tokenString == "" {
		conn.WriteJSON(gin.H{"error": "No token provided"})
		return
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(getEnv("JWT_SECRET", "secret")), nil
	})

	if err != nil || !token.Valid {
		conn.WriteJSON(gin.H{"error": "Invalid token"})
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	userID, _ := claims["id"].(string)
	username, _ := claims["username"].(string)
	user := User{ID: userID, Username: username}

	client := &Client{
		Conn:  conn,
		User:  user,
		Rooms: make(map[string]bool),
	}
	clients[userID] = client
	defer func() {
		delete(clients, userID)
		for roomID := range client.Rooms {
			broadcastToRoom(roomID, gin.H{"type": "user-left", "userId": userID}, userID)
			delete(rooms[roomID], userID)
		}
	}()

	log.Printf("User connected: %s", user.Username)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("User disconnected: %s", user.Username)
			break
		}

		var envelope struct {
			Type string          `json:"type"`
			Data json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(msg, &envelope); err != nil {
			continue
		}

		ctx := context.Background()
		switch envelope.Type {
		case "join-channel":
			var data struct{ ChannelID string `json:"channelId"` }
			json.Unmarshal(envelope.Data, &data)
			client.Rooms[data.ChannelID] = true
			if rooms[data.ChannelID] == nil {
				rooms[data.ChannelID] = make(map[string]bool)
			}
			rooms[data.ChannelID][userID] = true

			var messages []Message
			if redisClient != nil {
				rawMsgs, _ := redisClient.LRange(ctx, "channel:"+data.ChannelID+":messages", 0, 49).Result()
				for _, m := range rawMsgs {
					var msg Message
					json.Unmarshal([]byte(m), &msg)
					messages = append(messages, msg)
				}
			}
			conn.WriteJSON(gin.H{
				"type":      "joined",
				"channelId": data.ChannelID,
				"messages":  messages,
			})
			broadcastToRoom(data.ChannelID, gin.H{
				"type": "user-joined",
				"user": gin.H{"id": userID, "username": username},
			}, "")
		case "leave-channel":
			var data struct{ ChannelID string `json:"channelId"` }
			json.Unmarshal(envelope.Data, &data)
			delete(client.Rooms, data.ChannelID)
			if rooms[data.ChannelID] != nil {
				delete(rooms[data.ChannelID], userID)
			}
			broadcastToRoom(data.ChannelID, gin.H{
				"type":   "user-left",
				"userId": userID,
			}, userID)
		case "send-message":
			var data struct {
				ChannelID string `json:"channelId"`
				Content   string `json:"content"`
			}
			json.Unmarshal(envelope.Data, &data)
			msg := Message{
				ID:        strconv.FormatInt(time.Now().UnixNano(), 10),
				Content:   data.Content,
				ChannelID: data.ChannelID,
				UserID:    user.ID,
				Username:  user.Username,
				Timestamp: time.Now().Format(time.RFC3339),
			}
			if redisClient != nil {
				redisClient.LPush(ctx, "channel:"+data.ChannelID+":messages", mustMarshal(msg))
				redisClient.LTrim(ctx, "channel:"+data.ChannelID+":messages", 0, 99)
			}
			broadcastToRoom(data.ChannelID, gin.H{
				"type":    "new-message",
				"message": msg,
			}, "")
		case "typing":
			var data struct{ ChannelID string `json:"channelId"` }
			json.Unmarshal(envelope.Data, &data)
			broadcastToRoom(data.ChannelID, gin.H{
				"type":     "user-typing",
				"userId":   userID,
				"username": username,
			}, userID)
		case "voice-connect":
			var data struct{ ChannelID string `json:"channelId"` }
			json.Unmarshal(envelope.Data, &data)
			if redisClient != nil {
				redisClient.SAdd(ctx, "channel:"+data.ChannelID+":voice", userID)
			}
			broadcastToRoom(data.ChannelID, gin.H{
				"type":  "voice-users-updated",
				"users": []string{userID},
			}, "")
		case "voice-disconnect":
			var data struct{ ChannelID string `json:"channelId"` }
			json.Unmarshal(envelope.Data, &data)
			if redisClient != nil {
				redisClient.SRem(ctx, "channel:"+data.ChannelID+":voice", userID)
			}
		}
	}
}

func broadcastToRoom(roomID string, msg interface{}, excludeUserID string) {
	data, _ := json.Marshal(msg)
	for uid, c := range clients {
		if uid == excludeUserID {
			continue
		}
		if c.Rooms[roomID] {
			c.Conn.WriteMessage(websocket.TextMessage, data)
		}
	}
}