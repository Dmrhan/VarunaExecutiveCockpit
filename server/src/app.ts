
import express from 'express';
import cors from 'cors';
import opportunityRoutes from './routes/opportunities';
import reportRoutes from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow all origins for dev simplicity
app.use(express.json());

// Routes
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
// Start server
app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
