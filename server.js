const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// File to store visitor data
const visitorDataFile = path.join(dataDir, 'visitors.json');

// Initialize visitors file if it doesn't exist
if (!fs.existsSync(visitorDataFile)) {
    fs.writeFileSync(visitorDataFile, JSON.stringify([], null, 2));
}

// API endpoint to track visitors
app.post('/api/track', (req, res) => {
    try {
        const visitorData = req.body;
        
        // Add unique ID and server timestamp
        visitorData.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        visitorData.serverTimestamp = new Date().toISOString();
        
        // Read existing data
        let visitors = [];
        try {
            const fileData = fs.readFileSync(visitorDataFile, 'utf8');
            visitors = JSON.parse(fileData);
        } catch (error) {
            console.log('Creating new visitors file');
        }
        
        // Add new visitor
        visitors.push(visitorData);
        
        // Save to file
        fs.writeFileSync(visitorDataFile, JSON.stringify(visitors, null, 2));
        
        console.log('New visitor tracked:', {
            id: visitorData.id,
            ip: visitorData.ip,
            device: visitorData.deviceType,
            browser: visitorData.browser,
            location: `${visitorData.city}, ${visitorData.country}`
        });
        
        res.status(200).json({
            success: true,
            message: 'Visitor tracked successfully',
            visitorId: visitorData.id
        });
        
    } catch (error) {
        console.error('Error tracking visitor:', error);
        res.status(500).json({
            success: false,
            message: 'Error tracking visitor'
        });
    }
});

// API endpoint to get all visitors
app.get('/api/visitors', (req, res) => {
    try {
        const fileData = fs.readFileSync(visitorDataFile, 'utf8');
        const visitors = JSON.parse(fileData);
        
        res.status(200).json({
            success: true,
            count: visitors.length,
            visitors: visitors
        });
    } catch (error) {
        console.error('Error reading visitors:', error);
        res.status(500).json({
            success: false,
            message: 'Error reading visitors'
        });
    }
});

// API endpoint to get visitor statistics
app.get('/api/stats', (req, res) => {
    try {
        const fileData = fs.readFileSync(visitorDataFile, 'utf8');
        const visitors = JSON.parse(fileData);
        
        // Calculate statistics
        const stats = {
            totalVisitors: visitors.length,
            browsers: {},
            devices: {},
            countries: {},
            cities: {}
        };
        
        visitors.forEach(visitor => {
            // Count browsers
            stats.browsers[visitor.browser] = (stats.browsers[visitor.browser] || 0) + 1;
            
            // Count devices
            stats.devices[visitor.deviceType] = (stats.devices[visitor.deviceType] || 0) + 1;
            
            // Count countries
            stats.countries[visitor.country] = (stats.countries[visitor.country] || 0) + 1;
            
            // Count cities
            stats.cities[visitor.city] = (stats.cities[visitor.city] || 0) + 1;
        });
        
        res.status(200).json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Error calculating stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating statistics'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   Tracking Server Running                  ║
╠════════════════════════════════════════════╣
║   Port: ${PORT}                                ║
║   Endpoints:                               ║
║   - POST /api/track    (Track visitor)     ║
║   - GET  /api/visitors (Get all visitors)  ║
║   - GET  /api/stats    (Get statistics)    ║
║   - GET  /api/health   (Health check)      ║
╚════════════════════════════════════════════╝
    `);
});
