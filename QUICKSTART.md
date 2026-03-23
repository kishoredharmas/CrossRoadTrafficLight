# Traffic Light Simulation - Quick Start Guide

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings (optional)
# Default settings work fine for local development
```

### Step 3: Start the Application

**Option A: Development Mode (Recommended for Development)**
```bash
# Start both backend and frontend with hot reload
npm run dev:full
```

This will start:
- Backend server on http://localhost:3001
- Frontend on http://localhost:3000
- WebSocket server on ws://localhost:8080

**Option B: Production Mode**
```bash
# Build frontend
npm run build

# Start server
npm start
```

**Option C: Using Docker**
```bash
# Build and start containers
docker-compose up

# Or run in background
docker-compose up -d
```

## 📖 First Time User Guide

### 1. Create Your First Session

1. Open http://localhost:3000 in your browser
2. Click "New Session" on the dashboard
3. Enter a name like "My First Traffic Sim"
4. Click "Create"

### 2. Configure the Simulation

Once in the session page:
1. Choose an algorithm from the dropdown (try "Fixed-Time" first)
2. Adjust parameters:
   - Cycle Time: 60 seconds
   - Green Time: 25 seconds
3. Click "Apply" to update the algorithm

### 3. Start the Simulation

1. Click the "Start" button
2. Watch vehicles spawn and move through the intersection
3. Observe traffic signals changing colors
4. Monitor statistics in the right panel

### 4. Design a Custom Crossroad

1. Go to "Crossroad Designer" from the menu
2. Set the crossroad name and location
3. Add or remove lanes for each direction
4. Click "Save Design"
5. Use this design in future sessions

### 5. Record a Simulation

1. In an active session, click "Record"
2. Let the simulation run for a while
3. Click "Stop Recording"
4. Go to "Recordings" to view and playback

## 🎯 Key Features to Try

### Testing Different Algorithms

Try each algorithm to see performance differences:

1. **Fixed-Time**: Good baseline, predictable timing
2. **Adaptive**: Adjusts to traffic density
3. **Actuated**: Responds to vehicle presence
4. **Coordinated**: Creates green waves

### Multiple UI Clients

1. Open the same session in multiple browser tabs
2. All clients will see synchronized updates
3. Control from any client

### Map Integration

1. Go to Crossroad Designer
2. Enter real coordinates (e.g., 40.7128, -74.0060 for NYC)
3. View the location on the map
4. Switch between OpenStreetMap and Google Maps

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is already in use
lsof -i :3001

# Kill the process if needed
kill -9 <PID>
```

### Frontend won't start
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Clear npm cache and reinstall
cd client
rm -rf node_modules
npm install
```

### WebSocket connection issues
- Check if port 8080 is open
- Verify .env file has correct WS_PORT setting
- Check browser console for WebSocket errors

### Data not persisting
- Ensure data/ directory exists and is writable
- Check file permissions on data/sessions and data/recordings

## 📚 Next Steps

- Explore the [full README](README.md) for detailed documentation
- Try different traffic patterns
- Experiment with algorithm parameters
- Create multiple crossroad designs
- Analyze recordings for optimization

## 💡 Tips

1. **Start Simple**: Begin with the default crossroad and Fixed-Time algorithm
2. **Record Everything**: Enable recording to analyze later
3. **Compare Algorithms**: Save different sessions with different algorithms
4. **Use Real Locations**: Set actual coordinates for realistic scenarios
5. **Monitor Statistics**: Watch vehicle count and timing patterns

## 🆘 Getting Help

- Check the console logs for errors
- Review the API documentation in README.md
- Look at WebSocket message format for debugging
- Create an issue on GitLab for bugs or questions

Happy Simulating! 🚦
