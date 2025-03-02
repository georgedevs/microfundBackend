// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MicroFund API Documentation',
      version: '1.0.0',
      description: 'API documentation for MicroFund backend',
    },
    
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
        ? process.env.API_URL
        : 'http://localhost:5000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'fullName', 'institution', 'department', 'level'],
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              description: 'User email',
            },
            fullName: {
              type: 'string',
              description: 'User full name',
            },
            institution: {
              type: 'string',
              description: 'User institution/university',
            },
            department: {
              type: 'string',
              description: 'User department',
            },
            level: {
              type: 'string',
              description: 'User academic level',
            },
            walletBalance: {
              type: 'number',
              description: 'User wallet balance',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'fullName', 'institution', 'department', 'level'],
          properties: {
            email: {
              type: 'string',
              description: 'University email address',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
            },
            fullName: {
              type: 'string',
              description: 'User full name',
            },
            institution: {
              type: 'string',
              description: 'User institution/university',
            },
            department: {
              type: 'string',
              description: 'User department',
            },
            level: {
              type: 'string',
              description: 'User academic level',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              description: 'User email',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Operation success status',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                token: {
                  type: 'string',
                  description: 'JWT access token',
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token',
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;