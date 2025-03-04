const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, // Correct key name
            useUnifiedTopology: true, // Ensures compatibility with the MongoDB driver
        });

        console.log('Database connected successfully');
    } catch (err) {
        console.error(`Error connecting to database: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDatabase;
