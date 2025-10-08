const express = require ("express");
const { authenticatedUser , owner} = require("../middleware/authMiddleware");
const {  getAllOrders, UserOrder, getEachOrder, updateOrderStatus} = require("../controllers/orderController");
const router = express.Router();



router.get("/getAll", getAllOrders);
router.get("/MyOrder", authenticatedUser, UserOrder);
router.get("/getByID/:order_id", owner, getEachOrder);
router.patch("/updateOrderStatus/:order_id", updateOrderStatus);



module.exports = router