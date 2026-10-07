export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "School ERP API",
    version: "1.0.0",
    description: "REST API for Admin, Teacher, and Parent roles in the School ERP mobile app.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: { security: [], summary: "Health check", responses: { "200": { description: "OK" } } },
    },
    "/api/auth/login": {
      post: {
        security: [],
        summary: "Login with loginId and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["loginId", "password"],
                properties: { loginId: { type: "string" }, password: { type: "string" } },
              },
            },
          },
        },
        responses: { "200": { description: "JWT tokens and user" } },
      },
    },
    "/api/auth/register": {
      post: { summary: "Register user (Admin only)", responses: { "201": { description: "Created" } } },
    },
    "/api/auth/forgot-password": {
      post: { security: [], summary: "Start password reset", responses: { "200": { description: "OTP issued" } } },
    },
    "/api/auth/verify-otp": {
      post: { security: [], summary: "Verify OTP and reset password", responses: { "200": { description: "Reset" } } },
    },
    "/api/auth/refresh-token": {
      post: { security: [], summary: "Refresh JWT", responses: { "200": { description: "New tokens" } } },
    },
    "/api/admin/students": {
      get: { summary: "List students", responses: { "200": { description: "Paged students" } } },
      post: { summary: "Create student with parent", responses: { "201": { description: "Created" } } },
    },
    "/api/teacher/attendance": {
      post: { summary: "Mark class attendance", responses: { "201": { description: "Marked" } } },
    },
    "/api/parent/children": {
      get: { summary: "List parent children", responses: { "200": { description: "Children" } } },
    },
  },
};
