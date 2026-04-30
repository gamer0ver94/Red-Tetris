
    const schema = {
  "asyncapi": "3.1.0",
  "id": "urn:red-tetris:socket-api",
  "defaultContentType": "application/json",
  "info": {
    "title": "Red Tetris Socket API",
    "version": "0.1.0",
    "description": "Socket.IO protocol for lobby, connection recovery, and status updates. The connection handshake requires the rt.sid cookie and an auth.csrf_token value matching the registered player session.\n",
    "contact": {
      "name": "Red Tetris Team",
      "email": "team@example.com"
    },
    "license": {
      "name": "MIT"
    },
    "tags": [
      {
        "name": "sockets"
      },
      {
        "name": "lobby"
      },
      {
        "name": "session"
      }
    ]
  },
  "servers": {
    "local": {
      "host": "localhost:1800",
      "protocol": "socket.io",
      "description": "Local development Socket.IO server.",
      "security": [
        {
          "type": "httpApiKey",
          "name": "rt.sid",
          "in": "cookie",
          "description": "Secure session cookie issued by the HTTP auth routes."
        }
      ]
    }
  },
  "channels": {
    "lobbyJoin": {
      "address": "lobby:join",
      "messages": {
        "LobbyJoin": {
          "name": "LobbyJoin",
          "title": "Join a lobby",
          "summary": "Client asks to join an existing multiplayer lobby.",
          "payload": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "game_id": {
                "type": "string",
                "description": "Identifier of the lobby/game to join.",
                "x-parser-schema-id": "<anonymous-schema-2>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-1>"
          },
          "x-parser-unique-object-id": "LobbyJoin"
        }
      },
      "x-parser-unique-object-id": "lobbyJoin"
    },
    "lobbyJoinError": {
      "address": "lobby:join:error",
      "messages": {
        "LobbyJoinError": {
          "name": "LobbyJoinError",
          "payload": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "reason"
            ],
            "properties": {
              "reason": {
                "type": "string",
                "examples": [
                  "missing game id",
                  "game not found",
                  "the match is full",
                  "you can't join a game you are in",
                  "you can't start this game",
                  "unknown game status"
                ],
                "x-parser-schema-id": "<anonymous-schema-3>"
              }
            },
            "x-parser-schema-id": "ErrorPayload"
          },
          "x-parser-unique-object-id": "LobbyJoinError"
        }
      },
      "x-parser-unique-object-id": "lobbyJoinError"
    },
    "lobbyJoinSuccess": {
      "address": "lobby:join:success",
      "messages": {
        "LobbyJoinSuccess": {
          "name": "LobbyJoinSuccess",
          "summary": "Join request succeeded.",
          "payload": {
            "type": "object",
            "additionalProperties": false,
            "x-parser-schema-id": "EmptyPayload"
          },
          "x-parser-unique-object-id": "LobbyJoinSuccess"
        }
      },
      "x-parser-unique-object-id": "lobbyJoinSuccess"
    },
    "lobbyJoinUpdate": {
      "address": "lobby:join:update",
      "messages": {
        "LobbyJoinUpdate": {
          "name": "LobbyJoinUpdate",
          "summary": "Broadcast to lobby members when a player joins.",
          "payload": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "message"
            ],
            "properties": {
              "message": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-4>"
              }
            },
            "x-parser-schema-id": "MessagePayload"
          },
          "x-parser-unique-object-id": "LobbyJoinUpdate"
        }
      },
      "x-parser-unique-object-id": "lobbyJoinUpdate"
    },
    "lobbyStart": {
      "address": "lobby:start",
      "messages": {
        "LobbyStart": {
          "name": "LobbyStart",
          "title": "Start a lobby",
          "summary": "Client asks to start the game for its current lobby.",
          "payload": "$ref:$.channels.lobbyJoinSuccess.messages.LobbyJoinSuccess.payload",
          "x-parser-unique-object-id": "LobbyStart"
        }
      },
      "x-parser-unique-object-id": "lobbyStart"
    },
    "lobbyStartError": {
      "address": "lobby:start:error",
      "messages": {
        "LobbyStartError": {
          "name": "LobbyStartError",
          "payload": "$ref:$.channels.lobbyJoinError.messages.LobbyJoinError.payload",
          "x-parser-unique-object-id": "LobbyStartError"
        }
      },
      "x-parser-unique-object-id": "lobbyStartError"
    },
    "lobbyStartSuccess": {
      "address": "lobby:start:success",
      "messages": {
        "LobbyStartSuccess": {
          "name": "LobbyStartSuccess",
          "payload": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "data"
            ],
            "properties": {
              "data": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "game_id",
                  "type",
                  "mode",
                  "status"
                ],
                "properties": {
                  "game_id": {
                    "type": "string",
                    "x-parser-schema-id": "<anonymous-schema-6>"
                  },
                  "type": {
                    "type": "string",
                    "x-parser-schema-id": "<anonymous-schema-7>"
                  },
                  "mode": {
                    "type": "string",
                    "x-parser-schema-id": "<anonymous-schema-8>"
                  },
                  "status": {
                    "type": "string",
                    "enum": [
                      "started"
                    ],
                    "x-parser-schema-id": "<anonymous-schema-9>"
                  }
                },
                "x-parser-schema-id": "LobbyStartData"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-5>"
          },
          "x-parser-unique-object-id": "LobbyStartSuccess"
        }
      },
      "x-parser-unique-object-id": "lobbyStartSuccess"
    },
    "lobbyLeave": {
      "address": "lobby:leave",
      "messages": {
        "LobbyLeave": {
          "name": "LobbyLeave",
          "title": "Leave a lobby",
          "summary": "Client asks to leave its current lobby.",
          "payload": "$ref:$.channels.lobbyJoinSuccess.messages.LobbyJoinSuccess.payload",
          "x-parser-unique-object-id": "LobbyLeave"
        }
      },
      "x-parser-unique-object-id": "lobbyLeave"
    },
    "lobbyLeaveError": {
      "address": "lobby:leave:error",
      "messages": {
        "LobbyLeaveError": {
          "name": "LobbyLeaveError",
          "payload": "$ref:$.channels.lobbyJoinError.messages.LobbyJoinError.payload",
          "x-parser-unique-object-id": "LobbyLeaveError"
        }
      },
      "x-parser-unique-object-id": "lobbyLeaveError"
    },
    "lobbyLeaveSuccess": {
      "address": "lobby:leave:success",
      "messages": {
        "LobbyLeaveSuccess": {
          "name": "LobbyLeaveSuccess",
          "summary": "Leave request succeeded.",
          "payload": "$ref:$.channels.lobbyJoinSuccess.messages.LobbyJoinSuccess.payload",
          "x-parser-unique-object-id": "LobbyLeaveSuccess"
        }
      },
      "x-parser-unique-object-id": "lobbyLeaveSuccess"
    },
    "lobbyLeaveUpdate": {
      "address": "lobby:leave:update",
      "messages": {
        "LobbyLeaveUpdate": {
          "name": "LobbyLeaveUpdate",
          "summary": "Broadcast to remaining lobby members when a player leaves.",
          "payload": "$ref:$.channels.lobbyJoinUpdate.messages.LobbyJoinUpdate.payload",
          "x-parser-unique-object-id": "LobbyLeaveUpdate"
        }
      },
      "x-parser-unique-object-id": "lobbyLeaveUpdate"
    },
    "lobbyNewOwner": {
      "address": "lobby:new_owner",
      "messages": {
        "LobbyNewOwner": {
          "name": "LobbyNewOwner",
          "summary": "Broadcast to the player promoted as the new lobby owner.",
          "payload": "$ref:$.channels.lobbyJoinSuccess.messages.LobbyJoinSuccess.payload",
          "x-parser-unique-object-id": "LobbyNewOwner"
        }
      },
      "x-parser-unique-object-id": "lobbyNewOwner"
    },
    "playerStatusChange": {
      "address": "player_status:change",
      "messages": {
        "PlayerStatusChange": {
          "name": "PlayerStatusChange",
          "payload": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "new_status"
            ],
            "properties": {
              "new_status": {
                "type": "string",
                "enum": [
                  "disconnected",
                  "connected",
                  "waiting_socket",
                  "waiting",
                  "playing"
                ],
                "x-parser-schema-id": "PlayerStatus"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-10>"
          },
          "x-parser-unique-object-id": "PlayerStatusChange"
        }
      },
      "x-parser-unique-object-id": "playerStatusChange"
    },
    "gameStatusChange": {
      "address": "game_status:change",
      "messages": {
        "GameStatusChange": {
          "name": "GameStatusChange",
          "payload": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "new_status"
            ],
            "properties": {
              "new_status": {
                "type": "string",
                "enum": [
                  "created",
                  "waiting",
                  "started",
                  "finish"
                ],
                "x-parser-schema-id": "GameStatus"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-11>"
          },
          "x-parser-unique-object-id": "GameStatusChange"
        }
      },
      "x-parser-unique-object-id": "gameStatusChange"
    },
    "sessionResume": {
      "address": "session:resume",
      "messages": {
        "SessionResume": {
          "name": "SessionResume",
          "summary": "Sent after a socket connection is initialized or recovered.",
          "payload": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "reconnected",
              "player",
              "game",
              "render_state"
            ],
            "properties": {
              "reconnected": {
                "type": "boolean",
                "x-parser-schema-id": "<anonymous-schema-12>"
              },
              "player": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "player_id",
                  "username",
                  "player_status",
                  "csrf_token"
                ],
                "properties": {
                  "player_id": {
                    "type": "string",
                    "x-parser-schema-id": "<anonymous-schema-14>"
                  },
                  "username": {
                    "type": "string",
                    "x-parser-schema-id": "<anonymous-schema-15>"
                  },
                  "player_status": "$ref:$.channels.playerStatusChange.messages.PlayerStatusChange.payload.properties.new_status",
                  "csrf_token": {
                    "type": "string",
                    "x-parser-schema-id": "<anonymous-schema-16>"
                  }
                },
                "x-parser-schema-id": "<anonymous-schema-13>"
              },
              "game": {
                "oneOf": [
                  {
                    "type": "null",
                    "x-parser-schema-id": "<anonymous-schema-18>"
                  },
                  {
                    "type": "object",
                    "additionalProperties": false,
                    "required": [
                      "game_id",
                      "owner_id",
                      "game_type",
                      "game_mode",
                      "game_status",
                      "players_ids"
                    ],
                    "properties": {
                      "game_id": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-19>"
                      },
                      "owner_id": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-20>"
                      },
                      "game_type": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-21>"
                      },
                      "game_mode": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-22>"
                      },
                      "game_status": "$ref:$.channels.gameStatusChange.messages.GameStatusChange.payload.properties.new_status",
                      "players_ids": {
                        "type": "array",
                        "items": {
                          "type": "string",
                          "x-parser-schema-id": "<anonymous-schema-24>"
                        },
                        "x-parser-schema-id": "<anonymous-schema-23>"
                      }
                    },
                    "x-parser-schema-id": "ResumeGame"
                  }
                ],
                "x-parser-schema-id": "<anonymous-schema-17>"
              },
              "render_state": {
                "oneOf": [
                  {
                    "type": "null",
                    "x-parser-schema-id": "<anonymous-schema-26>"
                  },
                  {
                    "type": "object",
                    "additionalProperties": true,
                    "x-parser-schema-id": "<anonymous-schema-27>"
                  }
                ],
                "x-parser-schema-id": "<anonymous-schema-25>"
              }
            },
            "x-parser-schema-id": "SessionResumePayload"
          },
          "x-parser-unique-object-id": "SessionResume"
        }
      },
      "x-parser-unique-object-id": "sessionResume"
    },
    "connectError": {
      "address": "connect_error",
      "messages": {
        "ConnectError": {
          "name": "ConnectError",
          "summary": "Socket.IO handshake rejection reason.",
          "payload": {
            "type": "object",
            "additionalProperties": true,
            "required": [
              "message"
            ],
            "properties": {
              "message": {
                "type": "string",
                "enum": [
                  "missing csrf token",
                  "missing session",
                  "invalid session",
                  "forbidden",
                  "process error"
                ],
                "x-parser-schema-id": "<anonymous-schema-29>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-28>"
          },
          "x-parser-unique-object-id": "ConnectError"
        }
      },
      "x-parser-unique-object-id": "connectError"
    }
  },
  "operations": {
    "emitLobbyJoin": {
      "action": "send",
      "channel": "$ref:$.channels.lobbyJoin",
      "messages": [
        "$ref:$.channels.lobbyJoin.messages.LobbyJoin"
      ],
      "x-parser-unique-object-id": "emitLobbyJoin"
    },
    "onLobbyJoinError": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyJoinError",
      "messages": [
        "$ref:$.channels.lobbyJoinError.messages.LobbyJoinError"
      ],
      "x-parser-unique-object-id": "onLobbyJoinError"
    },
    "onLobbyJoinSuccess": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyJoinSuccess",
      "messages": [
        "$ref:$.channels.lobbyJoinSuccess.messages.LobbyJoinSuccess"
      ],
      "x-parser-unique-object-id": "onLobbyJoinSuccess"
    },
    "onLobbyJoinUpdate": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyJoinUpdate",
      "messages": [
        "$ref:$.channels.lobbyJoinUpdate.messages.LobbyJoinUpdate"
      ],
      "x-parser-unique-object-id": "onLobbyJoinUpdate"
    },
    "emitLobbyStart": {
      "action": "send",
      "channel": "$ref:$.channels.lobbyStart",
      "messages": [
        "$ref:$.channels.lobbyStart.messages.LobbyStart"
      ],
      "x-parser-unique-object-id": "emitLobbyStart"
    },
    "onLobbyStartError": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyStartError",
      "messages": [
        "$ref:$.channels.lobbyStartError.messages.LobbyStartError"
      ],
      "x-parser-unique-object-id": "onLobbyStartError"
    },
    "onLobbyStartSuccess": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyStartSuccess",
      "messages": [
        "$ref:$.channels.lobbyStartSuccess.messages.LobbyStartSuccess"
      ],
      "x-parser-unique-object-id": "onLobbyStartSuccess"
    },
    "emitLobbyLeave": {
      "action": "send",
      "channel": "$ref:$.channels.lobbyLeave",
      "messages": [
        "$ref:$.channels.lobbyLeave.messages.LobbyLeave"
      ],
      "x-parser-unique-object-id": "emitLobbyLeave"
    },
    "onLobbyLeaveError": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyLeaveError",
      "messages": [
        "$ref:$.channels.lobbyLeaveError.messages.LobbyLeaveError"
      ],
      "x-parser-unique-object-id": "onLobbyLeaveError"
    },
    "onLobbyLeaveSuccess": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyLeaveSuccess",
      "messages": [
        "$ref:$.channels.lobbyLeaveSuccess.messages.LobbyLeaveSuccess"
      ],
      "x-parser-unique-object-id": "onLobbyLeaveSuccess"
    },
    "onLobbyLeaveUpdate": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyLeaveUpdate",
      "messages": [
        "$ref:$.channels.lobbyLeaveUpdate.messages.LobbyLeaveUpdate"
      ],
      "x-parser-unique-object-id": "onLobbyLeaveUpdate"
    },
    "onLobbyNewOwner": {
      "action": "receive",
      "channel": "$ref:$.channels.lobbyNewOwner",
      "messages": [
        "$ref:$.channels.lobbyNewOwner.messages.LobbyNewOwner"
      ],
      "x-parser-unique-object-id": "onLobbyNewOwner"
    },
    "onPlayerStatusChange": {
      "action": "receive",
      "channel": "$ref:$.channels.playerStatusChange",
      "messages": [
        "$ref:$.channels.playerStatusChange.messages.PlayerStatusChange"
      ],
      "x-parser-unique-object-id": "onPlayerStatusChange"
    },
    "onGameStatusChange": {
      "action": "receive",
      "channel": "$ref:$.channels.gameStatusChange",
      "messages": [
        "$ref:$.channels.gameStatusChange.messages.GameStatusChange"
      ],
      "x-parser-unique-object-id": "onGameStatusChange"
    },
    "onSessionResume": {
      "action": "receive",
      "channel": "$ref:$.channels.sessionResume",
      "messages": [
        "$ref:$.channels.sessionResume.messages.SessionResume"
      ],
      "x-parser-unique-object-id": "onSessionResume"
    },
    "onConnectError": {
      "action": "receive",
      "channel": "$ref:$.channels.connectError",
      "messages": [
        "$ref:$.channels.connectError.messages.ConnectError"
      ],
      "x-parser-unique-object-id": "onConnectError"
    }
  },
  "components": {
    "securitySchemes": {
      "sessionCookie": "$ref:$.servers.local.security[0]"
    },
    "messages": {
      "LobbyJoin": "$ref:$.channels.lobbyJoin.messages.LobbyJoin",
      "LobbyJoinError": "$ref:$.channels.lobbyJoinError.messages.LobbyJoinError",
      "LobbyJoinSuccess": "$ref:$.channels.lobbyJoinSuccess.messages.LobbyJoinSuccess",
      "LobbyJoinUpdate": "$ref:$.channels.lobbyJoinUpdate.messages.LobbyJoinUpdate",
      "LobbyStart": "$ref:$.channels.lobbyStart.messages.LobbyStart",
      "LobbyStartError": "$ref:$.channels.lobbyStartError.messages.LobbyStartError",
      "LobbyStartSuccess": "$ref:$.channels.lobbyStartSuccess.messages.LobbyStartSuccess",
      "LobbyLeave": "$ref:$.channels.lobbyLeave.messages.LobbyLeave",
      "LobbyLeaveError": "$ref:$.channels.lobbyLeaveError.messages.LobbyLeaveError",
      "LobbyLeaveSuccess": "$ref:$.channels.lobbyLeaveSuccess.messages.LobbyLeaveSuccess",
      "LobbyLeaveUpdate": "$ref:$.channels.lobbyLeaveUpdate.messages.LobbyLeaveUpdate",
      "LobbyNewOwner": "$ref:$.channels.lobbyNewOwner.messages.LobbyNewOwner",
      "PlayerStatusChange": "$ref:$.channels.playerStatusChange.messages.PlayerStatusChange",
      "GameStatusChange": "$ref:$.channels.gameStatusChange.messages.GameStatusChange",
      "SessionResume": "$ref:$.channels.sessionResume.messages.SessionResume",
      "ConnectError": "$ref:$.channels.connectError.messages.ConnectError"
    },
    "schemas": {
      "EmptyPayload": "$ref:$.channels.lobbyJoinSuccess.messages.LobbyJoinSuccess.payload",
      "ErrorPayload": "$ref:$.channels.lobbyJoinError.messages.LobbyJoinError.payload",
      "MessagePayload": "$ref:$.channels.lobbyJoinUpdate.messages.LobbyJoinUpdate.payload",
      "LobbyStartData": "$ref:$.channels.lobbyStartSuccess.messages.LobbyStartSuccess.payload.properties.data",
      "SessionResumePayload": "$ref:$.channels.sessionResume.messages.SessionResume.payload",
      "ResumeGame": "$ref:$.channels.sessionResume.messages.SessionResume.payload.properties.game.oneOf[1]",
      "PlayerStatus": "$ref:$.channels.playerStatusChange.messages.PlayerStatusChange.payload.properties.new_status",
      "GameStatus": "$ref:$.channels.gameStatusChange.messages.GameStatusChange.payload.properties.new_status"
    }
  },
  "x-parser-spec-parsed": true,
  "x-parser-api-version": 3,
  "x-parser-spec-stringified": true
};
    const config = {"show":{"sidebar":true},"sidebar":{"showOperations":"byDefault"}};
    const appRoot = document.getElementById('root');
    AsyncApiStandalone.render(
        { schema, config, }, appRoot
    );
  