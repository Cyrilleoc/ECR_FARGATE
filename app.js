const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Healthy'); // Change to your response
 });
app.get('/', (req, res) => {
	    res.send('Hello, World! This is my Node.js app running on ECS! This is my first app deployed on the ECS FARGATE, 
		     Now I will set up a jenkins pipeline to make this streamline and automate the process.
		    it takes persistency, resilience, and a lot of effort to archive your goals in this world, also you have to be commit to what you are doing');
});

app.listen(PORT, '0.0.0.0', () => {
	    console.log(`Server is running on http://localhost:${PORT}`);
});
