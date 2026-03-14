import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createSubscription,
  getAllSubscriptions,
  getUserSubscriptions,
} from "../controllers/subscription.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.post("/", protect, createSubscription);

subscriptionRouter.get("/", protect,getAllSubscriptions);


subscriptionRouter.get("/:id", (req, res) => {
  res.send({ message: "get one id subscription " });
});

subscriptionRouter.put("/subscription/:id", (req, res) => {
  res.send({ message: "update details of subscription " });
});

subscriptionRouter.delete("/subscription/:id", (req, res) => {
  res.send({ message: "subscription deleted" });
});

subscriptionRouter.get("/user/:id", protect, getUserSubscriptions);

subscriptionRouter.put("/:id/cancel", (req, res) => {
  res.send({ message: "cancel subscription " });
});

subscriptionRouter.get("/upcoming-renewal", (req, res) => {
  res.send({ message: "Get Upcoming" });
});

export default subscriptionRouter;
