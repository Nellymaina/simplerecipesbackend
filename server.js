 const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors');
const mongoose=require('mongoose')
const bodyParser = require('body-parser');
const bcrypt =require('bcrypt');
const jwt= require ('jsonwebtoken');
const cookieParser=require('cookie-parser');
const crypto = require("crypto");
const nodemailer = require('nodemailer');


dotenv.config();

const app = express();
const PORT = 5000;
app.use(express.json(), cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());
const uri=process.env.MONGO_URI

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});


async function connectToDb() {
    try {
      await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("Connected to MongoDB Atlas!");
    } catch (error) {
      console.error("Error connecting to MongoDB Atlas:", error);
    }
  }
  
connectToDb();


const RestaurantSchema=mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
          },
          image: {
            type: String, 
            required: true,
          },
          category: {
            type: String,
            required: true,
          },
          cuisine: {
            type: String, 
            required: true,
          },
          ingredients: [
            {
              name: { type: String, required: true },
              quantity: { type: String, required: true }, 
            },
          ],
          instructions: [
            {
              step: { type: Number, required: true },
              description: { type: String, required: true }, 
            },
          ],
        },
            {timestamps: true
        }
    
);





const Restaurant = mongoose.model("Restaurant", RestaurantSchema);

const addRestaurant = async () => {
    const restaurant = new Restaurant({
        name: "General Tso's Chicken",
        image:"https://www.themealdb.com/images/media/meals/1529444113.jpg",
        category: "Chicken",
        cuisine: "Chinese",
        ingredients: [
          { name: "Chicken Breast", "quantity": "1 1/2" },
          { name: "Plain Flour", "quantity": "3/4 cup" },
          {name: "Egg", "quantity": "1" },
          {name: "Starch", "quantity": "2 tbs" },
          {name: "Baking Powder", "quantity": "1 tbs" },
          {name: "Salt", "quantity": "1 tsp" },
          {name: "Onion Salt", "quantity": "1/2 tsp" },
          {name: "Garlic Powder", "quantity": "1/4 tsp" },
          {name: "Water", "quantity": "3/4 cup" },
          {name: "Chicken Stock", "quantity": "1/2 cup" },
          {name: "Duck Sauce", "quantity": "1/4 cup" },
          {name: "Soy Sauce", "quantity": "3 tbs" },
          {name: "Honey", "quantity": "2 tbs" },
          {name: "Rice Vinegar", "quantity": "1 tbs" },
          {name: "Sesame Seed Oil", "quantity": "2 tbs" },
          {name: "Gochujang", "quantity": "1/2 tbs" },
          {name: "Starch", "quantity": "2 tbs" },
          {name: "Garlic", "quantity": "1 clove" },
          {name: "Spring Onions", "quantity": "2 chopped" },
          {name: "Ginger", "quantity": "1 tsp" },


          
          

],
        instructions: [
          { step: 1, description : "In a bowl, add 2 Cups of water, 2 Tablespoon soy sauce, 2 Tablespoon white vinegar, sherry cooking wine, 1/4 Teaspoon white pepper, minced ginger, minced garlic, hot pepper, ketchup, hoisin sauce, and sugar.Mix together well and set aside." },
          { step: 2, description: "In a bowl, add the chicken, 1 pinch of salt, 1 pinch of white pepper, 2 egg whites, and 3 Tablespoon of corn starch" },
          { step: 3, description : "Deep fry the chicken at 350 degrees for 3-4 minutes or until it is golden brown and loosen up the chicken so that they don't stick together.Set the chicken aside." },          
          { step: 4, description : "Add the sauce to the wok and then the broccoli and wait until it is boiling." },          
          { step: 5, description : "To thicken the sauce, whisk together 2 Tablespoon of cornstarch and 4 Tablespoon of water in a bowl and slowly add to your stir-fry until it's the right thickness." },     
          { step: 6, description : "Next add in the chicken and stir-fry for a minute and serve on a plate." },          
     
        ]
      });
  
    try {
      // Save the restaurant to the database
      const savedRestaurant = await restaurant.save(

      
      );
      console.log("New restaurant added:", savedRestaurant);
    } catch (error) {
      console.error("Error adding restaurant:", error);
    }
  };
  
  addRestaurant();

  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  }, { timestamps: true });
  
  const User = mongoose.model('User', userSchema);

  app.get('/api/restaurants', async (req,res)=>{
    try {
      const restaurants = await Restaurant.find();
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ error: "Error fetching restaurants" });
    }
  })
  
 

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7h' });
  
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });
  
    res.json({ message: 'Login successful' });
  });
  

  app.get("/api/me", (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Not logged in" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ user: { id: decoded.userId } });
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
});

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate a secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // Expires in 1 hour
      await user.save();
  
      // Send password reset email
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Password Reset Request",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      });
  
      res.json({ message: "Password reset link sent!" });
    } catch (error) {
      console.error("Forgot Password Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
  
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
  
      // Find user by reset token and check expiry
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
      });
  
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
  
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Update user's password and remove token
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset Password Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.post('/api/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'Logged out successfully' });
  });




  app.post("/api/recipes/:recipeId/reviews", async (req, res) => {
    try {
      const { recipeId } = req.params;
      const { user, rating, comment } = req.body;
  
      const newReview = new Review({ recipeId, user, rating, comment });
      await newReview.save();
  
      // Update the restaurant with the new review
      await Restaurant.findByIdAndUpdate(recipeId, { $push: { reviews: newReview._id } });
  
      res.status(201).json(newReview);
    } catch (error) {
      res.status(500).json({ message: "Error adding review", error });
    }
  });

  app.listen(5000, console.log("server working on port 5000"))



  