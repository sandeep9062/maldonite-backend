import mongoose from "mongoose";
import { validate } from "uuid";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please enter the name of Subscription"],
      trim: true,
      minLength: 12,
      maxLenght: 52,
    },

    price: {
      type: Number,
      required: [true, "Subscription price is required "],
      min: [0, "Price must be greater than 0"],
      max: [100000, "Price must be less than 1 lakh"],
    },

    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP"],
      default: "USD",
    },

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },

    category: {
      type: String,
      enum: ["sports", "news", "entertainment", "finance"],
    },

    paymentMethod: {
      type: String,
      required: [true, "payment method is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },

    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value <= new Date(),
        message: "start date must be in the past",
      },
    },

    renewalDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startDate; // this refering to the model
        },
        message: "Renewal date must be after start date",
      },
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // to  optimize the query by user field
    },
  },

  { timestamps: true }
);

subscriptionSchema.pre("save", function () {
  if (!this.renewalDate) {
    const renewalPeriod = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };

    this.renewalDate = new Date(this.startDate);
    this.renewalDate.setDate(
      this.renewalDate.getDate() + renewalPeriod[this.frequency]
    );
  }

  // Auto-update the status if renewal date has passed

  if (this.renewalDate < new Date()) {
    this.status = "expired";
  }

  next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
