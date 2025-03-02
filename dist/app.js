"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const bank_routes_1 = __importDefault(require("./routes/bank.routes"));
const savings_routes_1 = __importDefault(require("./routes/savings.routes"));
const business_routes_1 = __importDefault(require("./routes/business.routes"));
const education_routes_1 = __importDefault(require("./routes/education.routes"));
const app = (0, express_1.default)();
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:3000', 'https://abc123.ngrok.io'],
    credentials: true
}));
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use(requestLogger_1.requestLogger);
}
// Set up Swagger UI
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/wallet', wallet_routes_1.default);
app.use('/api/banks', bank_routes_1.default);
app.use('/api/webhooks', webhook_routes_1.default);
app.use('/api/savings', savings_routes_1.default);
app.use('/api/business', business_routes_1.default);
app.use('/api/education', education_routes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Error handling middleware (should be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
