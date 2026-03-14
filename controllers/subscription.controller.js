import Subscription from "../models/Subscription.js";

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });
    
    //await workflowClient.trigger

    res.status(201).json({
      success: true,
      data: subscription,
      message: "subscription created",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    if (req.user.id != req.params.id) {
      const error = new Error("not an authorized user of account");

      error.status = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({
      user: req.user.id,
    });

    res.status(200).json({
      success: true,
      data: subscriptions,
      message: "subscriptions of user (logged in)",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find();

    res.status(200).json({
      success: true,
      data: subscriptions,
      message: "all subscriptions",
    });
  } catch (error) {
    next(error);
  }
};
