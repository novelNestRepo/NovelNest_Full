package main

import (
	"context"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

var (
	redisClient *redis.Client
	dbPool      *pgxpool.Pool
)

func main() {
	godotenv.Load()

	redisOpts := &redis.Options{
		Addr: getEnv("REDIS_URL", "localhost:6379"),
	}
	redisClient = redis.NewClient(redisOpts)

	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Println("Redis connection failed:", err)
	} else {
		log.Println("Connected to Redis")
	}

	dbPool, _ = pgxpool.New(context.Background(), getEnv("DATABASE_URL", "postgres://postgres@localhost:5432/novelnest"))

	router := gin.Default()
	router.Use(corsMiddleware())
	router.Use(gin.Recovery())

	router.GET("/ws", handleWebSocket)

	api := router.Group("/api")
	{
		channels := api.Group("/channels", authMiddleware())
		{
			channels.POST("", createChannel)
			channels.GET("", getAllChannels)
			channels.GET("/:id", getChannel)
			channels.POST("/:channelId/join", joinChannel)
		}
	}

	port := getEnv("PORT", "5000")
	log.Printf("Server running on port %s", port)
	router.Run(":" + port)
}