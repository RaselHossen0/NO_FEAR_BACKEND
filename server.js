const express = require('express');
const { connectDB ,sequelize} = require('./config/db');
const authRoutes = require('./routes/Auth');
const profileRoutes = require('./routes/Profile');

const swaggerSetup = require('./swagger');
const User = require('./models/User');
const cors = require('cors');
const multer = require('multer');
const cluster = require('cluster');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all standard methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  credentials: true, // Allow credentials
  optionsSuccessStatus: 204 // Some legacy browsers choke on 204
}));

swaggerSetup(app);
// Connect to the database
connectDB();
sequelize.sync({ force: false,alter: true }).then(() => {
  console.log('Database & tables created!');
});

// Routes



app.use('/api/auth', authRoutes);

app.use('/api/profile', profileRoutes);
app.get('/', async (req, res) => {
 res.send('Hello World');
}
);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

// if (cluster.isMaster) {
//   const numCPUs = os.cpus().length;
//   console.log(`Master ${process.pid} is running`);
//   console.log(`Forking for ${numCPUs} CPUs`);

//   // Fork workers.
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     console.log('Starting a new worker');
//     cluster.fork();
//   });
// } else {
//   // Workers can share any TCP connection
//   // In this case it is an HTTP server
//   app.listen(PORT, () => {
//     console.log(`Worker ${process.pid} started`);
//   });
// }
