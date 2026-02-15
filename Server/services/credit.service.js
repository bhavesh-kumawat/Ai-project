const Credit = require("../Models/Credit.models.js");

async function resetDailyCredits() {
  const today = new Date();
  try {
    const result = await Credit.updateMany(
      {
        plan: { $in: ["free", "daily", "monthly"] },
        isUnlimited: false,
        $or: [
          {
            lastDailyReset: null,
          },
          {
            lastDailyReset: { $lt: new Date(today.setHours(0, 0, 0, 0)) },
          },
        ],
      },
      {
        $set: {
          dailyUsed: 0,
          lastDailyReset: new Date(),
        },
      },
    );
    console.log(
      `[CRON] Daily credit reset | Modified: ${result.modifiedCount} `,
    );
  } catch (error) {
    console.error("[CRON] Error resetting daily credits:", error);
  }
}

async function resetMonthlyCredits() {
  try {
    const result = await Credit.updateMany(
      {
        plan: "monthly",
        isUnlimited: false,
        $or: [
          { lastMonthlyReset: null },
          {
            lastMonthlyReset: {
              $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        ],
      },
      {
        $set: {
          monthlyUsed: 0,
          lastMonthlyReset: new Date(),
        },
      },
    );

    console.log(
      `[CRON] Monthly credits reset | Modified: ${result.modifiedCount}`,
    );
  } catch (error) {
    console.error("[CRON] Monthly reset failed:", error);
  }
}

/**
 * Ensures the user's credit record exists and limits are reset if needed.
 * @param {string} userId
 * @returns {Promise<Document>} The credit document
 */
async function getClientCredit(userId) {
  let credit = await Credit.findOne({ user: userId });
  if (!credit) {
    credit = await Credit.create({ user: userId });
  }

  let modified = false;
  const now = new Date();

  // Check Daily Reset
  if (credit.lastDailyReset) {
    const lastReset = new Date(credit.lastDailyReset);
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      credit.dailyUsed = 0;
      credit.lastDailyReset = now;
      modified = true;
    }
  }

  // Check Monthly Reset
  if (credit.lastMonthlyReset) {
    const lastReset = new Date(credit.lastMonthlyReset);
    const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);

    if (daysSinceReset >= 30) {
      credit.monthlyUsed = 0;
      credit.lastMonthlyReset = now;
      modified = true;
    }
  }

  // Check Subscription Expiry
  if (
    credit.subscriptionExpiresAt &&
    now > credit.subscriptionExpiresAt
  ) {
    credit.subscriptionStatus = "expired";
    credit.plan = "free";
    credit.isUnlimited = false;
    modified = true;
  }

  if (modified) {
    await credit.save();
  }

  return credit;
}

/**
 * Deducts credits from the user's account.
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<Document>} The updated credit document
 * @throws {Error} If insufficient credits or limits reached
 */
async function deductUserCredit(userId, amount = 1) {
  const credit = await getClientCredit(userId);

  // check if user has unlimited access
  if (credit.isUnlimited) {
    credit.totalGenerations += 1;
    await credit.save();
    return credit;
  }

  //check daily limit
  if (credit.dailyLimit > 0 && credit.dailyUsed >= credit.dailyLimit) {
    throw new Error("Daily Limit reached. Please Upgrade your plan or wait until tomorrow...");
  }

  //check monthly limit
  if (credit.monthlyLimit > 0 && credit.monthlyUsed >= credit.monthlyLimit) {
    throw new Error("Monthly Limit reached.");
  }

  //check user has enough Balance
  const totalAvailable = credit.balance + credit.bonusCredits;
  if (totalAvailable < amount) {
    throw new Error("Insufficient credits");
  }

  //deduct from bonus credits first, then balance
  if (credit.bonusCredits >= amount) {
    credit.bonusCredits -= amount;
  } else {
    const remaining = amount - credit.bonusCredits;
    credit.bonusCredits = 0;
    credit.balance -= remaining;
  }

  //update usage 
  credit.totalCreditsUsed += amount;
  credit.totalGenerations += 1;

  if (credit.dailyLimit > 0) {
    credit.dailyUsed += 1;
    if (!credit.lastDailyReset) {
      credit.lastDailyReset = new Date();
    }
  }
  if (credit.monthlyLimit > 0) {
    credit.monthlyUsed += 1;
    if (!credit.lastMonthlyReset) {
      credit.lastMonthlyReset = new Date();
    }
  }

  await credit.save();
  return credit;
}

/**
 * Adds credits to user balance.
 * @param {string} userId 
 * @param {number} amount 
 * @param {boolean} isBonus 
 * @returns {Promise<Document>}
 */
async function addUserCredits(userId, amount, isBonus = false) {
  const credit = await getClientCredit(userId);

  if (isBonus) {
    credit.bonusCredits += amount;
  } else {
    credit.balance += amount;
  }

  await credit.save();
  return credit;
}

/**
 * Refunds credits for a failed generation, correcting usage stats.
 * @param {string} userId 
 * @param {number} amount 
 * @returns {Promise<Document>}
 */
async function refundUserCredit(userId, amount) {
  const credit = await getClientCredit(userId);

  // Refund to balance (simplification, original source isn't tracked here)
  credit.balance += amount;

  // Decriment usage if > 0
  if (credit.totalCreditsUsed >= amount) {
    credit.totalCreditsUsed -= amount;
  }

  if (credit.totalGenerations > 0) {
    credit.totalGenerations -= 1;
  }

  if (credit.dailyUsed > 0) {
    credit.dailyUsed -= 1;
  }

  if (credit.monthlyUsed > 0) {
    credit.monthlyUsed -= 1;
  }

  await credit.save();
  return credit;
}

/**
 * Updates user plan and resets usage.
 * @param {string} userId 
 * @param {Object} planDetails 
 * @returns {Promise<Document>}
 */
async function updateUserPlan(userId, planDetails) {
  const credit = await getClientCredit(userId);

  // Extract fields to update
  // Note: Fixing typos from controller vs model. 
  // Model: stripeSubscriptionId, stripeCustomerId
  // Controller inputs potentially: stripSbscriptionId, stripCustomerId
  // I will accept both or standardized inputs. Assuming caller passes standardized now?
  // Or I stick to what the controller was parsing from body.
  // Controller: {plan, dailyLimit, monthlyLimit, isUnlimited, subscriptionExpiresAt, subscriptionStatus, stripSbscriptionId, stripCustomerId} = req.body;

  const { plan, dailyLimit, monthlyLimit, isUnlimited, subscriptionExpiresAt, subscriptionStatus, stripeSubscriptionId, stripeCustomerId, stripSbscriptionId, stripCustomerId } = planDetails;

  if (plan) credit.plan = plan;
  if (dailyLimit !== undefined) credit.dailyLimit = dailyLimit;
  if (monthlyLimit !== undefined) credit.monthlyLimit = monthlyLimit;
  if (isUnlimited !== undefined) credit.isUnlimited = isUnlimited;
  if (subscriptionExpiresAt) credit.subscriptionExpiresAt = subscriptionExpiresAt;
  if (subscriptionStatus) credit.subscriptionStatus = subscriptionStatus;

  // Map potential typos to correct model fields
  if (stripeSubscriptionId) credit.stripeSubscriptionId = stripeSubscriptionId;
  else if (stripSbscriptionId) credit.stripeSubscriptionId = stripSbscriptionId;

  if (stripeCustomerId) credit.stripeCustomerId = stripeCustomerId;
  else if (stripCustomerId) credit.stripeCustomerId = stripCustomerId;

  //reset usage on plan change or upgrade
  credit.dailyUsed = 0;
  credit.monthlyUsed = 0;
  credit.lastMonthlyReset = new Date();
  credit.lastDailyReset = new Date();

  await credit.save();
  return credit;
}

async function cancelUserSubscription(userId) {
  const credit = await getClientCredit(userId);

  credit.subscriptionStatus = "canceled";
  credit.isUnlimited = false;

  await credit.save();
  return credit;
}

async function getUserStatistics(userId) {
  const credit = await getClientCredit(userId);

  return {
    totalCredits: credit.balance + credit.bonusCredits,
    balance: credit.balance,
    bonusCredits: credit.bonusCredits,
    totalCreditsUsed: credit.totalCreditsUsed,
    totalGenerations: credit.totalGenerations,
    plan: credit.plan,
    dailyLimit: credit.dailyLimit,
    dailyUsed: credit.dailyUsed,
    monthlyLimit: credit.monthlyLimit,
    monthlyUsed: credit.monthlyUsed,
    isUnlimited: credit.isUnlimited,
    subscriptionExpiresAt: credit.subscriptionExpiresAt,
    subscriptionStatus: credit.subscriptionStatus,
  };
}

module.exports = {
  resetDailyCredits,
  resetMonthlyCredits,
  getClientCredit,
  deductUserCredit,
  addUserCredits,
  refundUserCredit,
  updateUserPlan,
  cancelUserSubscription,
  getUserStatistics
};
