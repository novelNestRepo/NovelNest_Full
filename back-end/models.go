package main

import "time"

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

type Message struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	ChannelID string `json:"channelId"`
	UserID    string `json:"userId"`
	Username  string `json:"username"`
	Timestamp string `json:"timestamp"`
}

type Channel struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	BookID      string    `json:"bookId"`
	CreatedBy   string    `json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
}