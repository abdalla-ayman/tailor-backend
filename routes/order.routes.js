const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, orderController.createOrder);
router.get("/", verifyToken, orderController.getOrders);
router.get("/:id", verifyToken, orderController.getOrderById);
router.put("/:id", verifyToken, orderController.updateOrder);
router.delete("/:id", verifyToken, orderController.deleteOrder);

module.exports = router;
