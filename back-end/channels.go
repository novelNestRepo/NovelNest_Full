package main

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func createChannel(c *gin.Context) {
	user, _ := c.Get("user")
	u := user.(User)

	var input struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Type        string `json:"type"`
		BookID      string `json:"bookId"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	channel := Channel{
		ID:          uuid.New().String(),
		Name:        input.Name,
		Description: input.Description,
		Type:        input.Type,
		BookID:      input.BookID,
		CreatedBy:   u.ID,
		CreatedAt:   time.Now(),
	}

	ctx := context.Background()
	_, err := dbPool.Exec(ctx,
		"INSERT INTO channels (id, name, description, type, book_id, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
		channel.ID, channel.Name, channel.Description, channel.Type, channel.BookID, channel.CreatedBy, channel.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create channel"})
		return
	}

	c.JSON(http.StatusCreated, channel)
}

func getAllChannels(c *gin.Context) {
	ctx := context.Background()
	rows, err := dbPool.Query(ctx, "SELECT id, name, description, type, book_id, created_by, created_at FROM channels")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch channels"})
		return
	}
	defer rows.Close()

	var channels []Channel
	for rows.Next() {
		var ch Channel
		err := rows.Scan(&ch.ID, &ch.Name, &ch.Description, &ch.Type, &ch.BookID, &ch.CreatedBy, &ch.CreatedAt)
		if err != nil {
			continue
		}
		channels = append(channels, ch)
	}

	c.JSON(http.StatusOK, channels)
}

func getChannel(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()
	var channel Channel
	err := dbPool.QueryRow(ctx,
		"SELECT id, name, description, type, book_id, created_by, created_at FROM channels WHERE id = $1",
		id,
	).Scan(&channel.ID, &channel.Name, &channel.Description, &channel.Type, &channel.BookID, &channel.CreatedBy, &channel.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Channel not found"})
		return
	}

	c.JSON(http.StatusOK, channel)
}

func joinChannel(c *gin.Context) {
	channelID := c.Param("channelId")
	user, _ := c.Get("user")
	u := user.(User)

	ctx := context.Background()
	_, err := dbPool.Exec(ctx,
		"INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		channelID, u.ID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join channel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Joined channel"})
}