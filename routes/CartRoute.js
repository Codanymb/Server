const express = require("express");
const { createCart, addToCart, removeFromCart, viewCart, checkOut, makePayment, viewOrders, viewOrderDetails,CartCounter} = require("../controllers/CartController");
const router = express.Router();
const { authenticatedUser } = require("../middleware/authMiddleware");


router.post("/create", authenticatedUser, createCart);          
router.post("/add",authenticatedUser,   addToCart);               
router.delete("/remove", authenticatedUser, removeFromCart);     
router.get("/view", authenticatedUser, viewCart);               
router.post("/checkout", authenticatedUser, checkOut);          
router.get("/orders", authenticatedUser, viewOrders);                 
router.get("/orders/:order_id", authenticatedUser, viewOrderDetails);
router.post("/payment", authenticatedUser, makePayment);      
router.get("/count", authenticatedUser, CartCounter);         


module.exports = router;
