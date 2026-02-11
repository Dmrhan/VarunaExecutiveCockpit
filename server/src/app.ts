
import express from 'express';
import cors from 'cors';
import opportunityRoutes from './routes/opportunities';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow all origins for dev simplicity
app.use(express.json());

// Routes
app.use('/api/opportunities', opportunityRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
