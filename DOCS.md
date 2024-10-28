# Avventura Technical Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [API Reference](#api-reference)
4. [Frontend Integration](#frontend-integration)
5. [Data Structures](#data-structures)

## Introduction

Avventura is a text-based Web3 RPG platform that allows developers to create and integrate interactive stories with blockchain capabilities. The platform consists of:

- A NestJS backend API (hosted and managed)
- A reference frontend implementation in Next.js

Base URL for all API endpoints: `https://avventura.jcloud-ver-jpe.ik-server.com`

## Architecture Overview

### Backend Architecture

The Avventura API is built with NestJS and implements:

- RESTful endpoints for game management and story progression
- Session-based authentication
- Story state management
- Web3 integration for token interactions

## API Reference

### Games API

#### Create Game

```http
POST /games

Description: Creates a new game instance for a story. Returns a session token for authentication.
```

**Request Body:**

```json
{
  "story": "optimistic-life",
  "currentStep": 1,
  "players": {
    "totalNumber": 1,
    "list": [
      {
        "name": "Alice",
        "age": 42,
        "force": 42,
        "intelligence": 42,
        "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      }
    ]
  }
}
```

**Response:**

```json
{
  "id": 1,
  "story": "optimistic-life",
  "currentStep": 1,
  "players": {
    "totalNumber": 1,
    "list": [
      {
        "name": "Alice",
        "age": 42,
        "force": 42,
        "intelligence": 42,
        "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      }
    ]
  },
  "sessions": ["6f8a45ef2b1c9d3a7e4f5b2d9c8e1a6b"]
}
```

#### Get Game State

```http
GET /games/{id}

Description: Retrieves the current state of a game, including player information and current step.
```

**Response:**

```json
{
  "id": 1,
  "story": "optimistic-life",
  "currentStep": 2,
  "players": {
    "totalNumber": 1,
    "list": [
      {
        "name": "Alice",
        "age": 42,
        "force": 42,
        "intelligence": 42,
        "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      }
    ]
  },
  "sessions": ["6f8a45ef2b1c9d3a7e4f5b2d9c8e1a6b"]
}
```

#### Update Game Step

```http
POST /games/{id}/next-step?token={sessionToken}

Description: Advances the game to the next step. May trigger on-chain transactions if the step includes rewards.
```

**Request Body:**

```json
{
  "nextStep": 2
}
```

**Response:**

```json
{
  "game": {
    "id": 1,
    "story": "optimistic-life",
    "currentStep": 2,
    "players": {
      "totalNumber": 1,
      "list": [
        {
          "name": "Alice",
          "age": 42,
          "force": 42,
          "intelligence": 42,
          "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        }
      ]
    },
    "sessions": ["6f8a45ef2b1c9d3a7e4f5b2d9c8e1a6b"]
  },
  "transaction": {
    "message": "You just got 10 RGCVII tokens!!",
    "txHash": "0x123..."
  }
}
```

#### Get Session Game

```http
GET /games/session?token={sessionToken}

Description: Retrieves the game ID associated with a session token. Used for resuming games.
```

**Response:**

```json
{
  "gameId": 1
}
```

### Steps API

#### Get Current Step

```http
GET /steps/single/{stepId}?storyName={storyName}

Description: Retrieves details about a specific step in a story, including description and available options.
```

**Response:**

```json
{
  "step": 1,
  "desc": "You live in a smart contract. What do you do?",
  "options": ["I decide to go out and explore the world.", "I just stay home and wait."],
  "paths": [2, 1]
}
```

#### Get All Story Steps

```http
GET /steps/story/{storyName}

Description: Retrieves all steps for a given story. Useful for story editors and debugging.
```

**Response:**

```json
[
  {
    "step": 1,
    "desc": "You live in a smart contract. What do you do?",
    "options": ["I decide to go out and explore the world.", "I just stay home and wait."],
    "paths": [2, 1]
  },
  {
    "step": 2,
    "desc": "Outside, you see all kinds of people carrying transactions...",
    "options": ["Offer to help carry transactions", "Ask someone about the world outside"],
    "paths": [3, 4]
  }
]
```

## Frontend Integration

Here's how to integrate Avventura into your frontend application:

### Starting a Game

```typescript
async function startGame(userName: string, walletAddress: string, story: string) {
  const response = await fetch('https://avventura.jcloud-ver-jpe.ik-server.com/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      story,
      currentStep: 1,
      players: {
        totalNumber: 1,
        list: [
          {
            name: userName,
            age: 42,
            force: 42,
            intelligence: 42,
            walletAddress,
          },
        ],
      },
    }),
  })

  const data = await response.json()
  // Store session token for future requests
  localStorage.setItem('avventuraSessionToken', data.sessions[0])
  return data
}
```

### Fetching Current Step

```typescript
async function fetchStep(stepNumber: number, storyName: string) {
  const response = await fetch(`https://avventura.jcloud-ver-jpe.ik-server.com/steps/single/${stepNumber}?storyName=${storyName}`)
  return await response.json()
}
```

### Updating Game Progress

```typescript
async function makeChoice(gameId: number, sessionToken: string, nextStep: number, storyName: string) {
  const response = await fetch(
    `https://avventura.jcloud-ver-jpe.ik-server.com/games/${gameId}/next-step?token=${sessionToken}&storyName=${storyName}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nextStep }),
    }
  )

  const data = await response.json()
  // Handle any blockchain transactions
  if (data.transaction) {
    // Display transaction notification to user
    console.log(`Transaction hash: ${data.transaction.txHash}`)
  }
  return data
}
```

### Resuming a Game

```typescript
async function resumeGame(sessionToken: string) {
  const response = await fetch(`https://avventura.jcloud-ver-jpe.ik-server.com/games/session?token=${sessionToken}`)
  const { gameId } = await response.json()
  return gameId
}
```

## Data Structures

### Game Object

```typescript
interface Game {
  id: number
  story: string
  currentStep: number
  players: {
    totalNumber: number
    list: Player[]
  }
  sessions: string[]
}

interface Player {
  name: string
  age: number
  force: number
  intelligence: number
  walletAddress: string
}
```

### Story Step

```typescript
interface StoryStep {
  step: number
  desc: string
  options: string[]
  paths: number[]
  action?: string // Optional on-chain action
}
```

### Transaction Result

```typescript
interface TransactionResult {
  message: string
  txHash: string
}
```

### Game Update Response

```typescript
interface GameUpdateResponse {
  game: Game
  transaction?: TransactionResult
}
```

### Error Responses

```typescript
interface ErrorResponse {
  statusCode: number
  message: string
  error: string
}
```

Example error:

```json
{
  "statusCode": 404,
  "message": "Game not found",
  "error": "Not Found"
}
```
