// scripts/addCoupons.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Coupon = require("../AdminBackEnd/Models/Coupon");

dotenv.config();

// ✅ Get current date and set expiry to 70 days
const today = new Date();
const seventyDaysLater = new Date();
seventyDaysLater.setDate(today.getDate() + 70);

const COUPONS = [
  {
    code: "FATHERSDAY15",
    type: "percentage",
    value: 15,
    minPurchase: 0,
    maxDiscount: null,
    applicableProducts: [],
    applicableCategories: [],
    applicableSunSigns: [],
    usageLimit: null, // ✅ Unlimited total usage
    perUserLimit: null, // ✅ Unlimited per user
    startDate: today,
    endDate: seventyDaysLater,
    isActive: true,
    applicableUsers: [],
    newUsersOnly: false,
    description: "15% off - Unlimited use",
  },
  {
    code: "LAUNCH5",
    type: "percentage",
    value: 5,
    minPurchase: 0,
    maxDiscount: null,
    applicableProducts: [],
    applicableCategories: [],
    applicableSunSigns: [],
    usageLimit: null, // ✅ Unlimited total usage
    perUserLimit: null, // ✅ Unlimited per user
    startDate: today,
    endDate: seventyDaysLater,
    isActive: true,
    applicableUsers: [],
    newUsersOnly: false, // ✅ No first order restriction
    description: "5% off - Unlimited use",
  },
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minPurchase: 0,
    maxDiscount: null,
    applicableProducts: [],
    applicableCategories: [],
    applicableSunSigns: [],
    usageLimit: null, // ✅ Unlimited total usage
    perUserLimit: null, // ✅ Unlimited per user
    startDate: today,
    endDate: seventyDaysLater,
    isActive: true,
    applicableUsers: [],
    newUsersOnly: false, // ✅ No first order restriction
    description: "10% off - Unlimited use",
  },
  {
    code: "EVT7X9QK3M",
    type: "percentage",
    value: 30,
    minPurchase: 0,
    maxDiscount: null,
    applicableProducts: [],
    applicableCategories: [],
    applicableSunSigns: [],
    usageLimit: null, // ✅ Unlimited total usage
    perUserLimit: null, // ✅ Unlimited per user
    startDate: today,
    endDate: seventyDaysLater,
    isActive: true,
    applicableUsers: [],
    newUsersOnly: false,
    description: "30% off - Unlimited use",
  },
  {
    code: "FRD4Z8P2LX",
    type: "percentage",
    value: 15,
    minPurchase: 0,
    maxDiscount: null,
    applicableProducts: [],
    applicableCategories: [],
    applicableSunSigns: [],
    usageLimit: null, // ✅ Unlimited total usage
    perUserLimit: null, // ✅ Unlimited per user
    startDate: today,
    endDate: seventyDaysLater,
    isActive: true,
    applicableUsers: [],
    newUsersOnly: false,
    description: "15% off - Unlimited use",
  },
  {
    code: "BLK9V6NQ1T",
    type: "percentage",
    value: 20,
    minPurchase: 0,
    maxDiscount: null,
    applicableProducts: [],
    applicableCategories: [],
    applicableSunSigns: [],
    usageLimit: null, // ✅ Unlimited total usage
    perUserLimit: null, // ✅ Unlimited per user
    startDate: today,
    endDate: seventyDaysLater,
    isActive: true,
    applicableUsers: [],
    newUsersOnly: false,
    description: "20% off - Unlimited use",
  },
  {
    code: "FML3X8K7ZR",
    type: "percentage",
    value: 25,
    minPurchase: 0,
    maxDiscount: null,
    applicableProducts: [],
    applicableCategories: [],
    applicableSunSigns: [],
    usageLimit: null, // ✅ Unlimited total usage
    perUserLimit: null, // ✅ Unlimited per user
    startDate: today,
    endDate: seventyDaysLater,
    isActive: true,
    applicableUsers: [],
    newUsersOnly: false,
    description: "25% off - Unlimited use",
  },
  {
    code: "IVY755WA",
    type: "percentage",
    value: 35,
    minPurchase: 0,
    maxDiscount: null,
    applicableProducts: [],
    applicableCategories: [],
    applicableSunSigns: [],
    usageLimit: null, // ✅ Unlimited total usage
    perUserLimit: null, // ✅ Unlimited per user
    startDate: today,
    endDate: seventyDaysLater,
    isActive: true,
    applicableUsers: [],
    newUsersOnly: false,
    description: "35% off - Unlimited use",
  },
];

async function addCoupons() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log(`📅 Coupon valid from: ${today.toLocaleDateString()}`);
    console.log(`📅 Coupon valid until: ${seventyDaysLater.toLocaleDateString()}`);
    console.log(`📅 Total validity: 70 days`);
    console.log(`♾️  All coupons: Unlimited usage (no per-user limit)`);

    const codes = COUPONS.map(c => c.code);
    
    // Delete existing coupons with these codes
    const deleted = await Coupon.deleteMany({ code: { $in: codes } });
    console.log(`🗑️ Deleted ${deleted.deletedCount} existing coupons`);

    // Insert new coupons
    const result = await Coupon.insertMany(COUPONS);
    console.log(`✅ Added ${result.length} coupons to database:`);
    result.forEach(c => {
      console.log(`  - ${c.code}: ${c.value}% off ${c.perUserLimit === null ? '(Unlimited per user)' : ''}`);
    });

    console.log("\n🎉 All coupons added successfully!");
    console.log(`📅 Valid from ${today.toLocaleDateString()} to ${seventyDaysLater.toLocaleDateString()} (70 days)`);
    console.log(`♾️  All coupons can be used unlimited times by any user`);
    
  } catch (error) {
    console.error("❌ Error adding coupons:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

addCoupons();