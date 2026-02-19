const { getClientCredit, deductUserCredit, addUserCredits, updateUserPlan, cancelUserSubscription, getUserStatistics } = require("../services/credit.service.js");
const Transaction = require("../Models/Transaction.models.js");

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(50);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transaction history",
      error: error.message,
    });
  }
};

exports.getUserCredit = async (req, res) => {
  try {
    const userId = req.user.id;
    const credit = await getClientCredit(userId);

    res.status(200).json({
      success: true,
      data: credit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching Credits",
      error: error.message,
    });
  }
};

exports.deductCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount = 1 } = req.body;

    const credit = await deductUserCredit(userId, amount);

    res.status(200).json({
      success: true,
      message: "Credits deducted successfully",
      data: credit
    });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 :
      (error.message.includes("Limit") || error.message.includes("Insufficient")) ? 403 : 400;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, isBonus = false } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "invalid credit amount",
      });
    }

    const credit = await addUserCredits(userId, amount, isBonus);

    res.status(200).json({
      success: true,
      message: "Credits added successfully",
      data: credit,
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error adding credits",
      error: error.message,
    })
  }
}

exports.updatePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const credit = await updateUserPlan(userId, req.body);

    res.status(200).json({
      success: true,
      message: "plan updated successfully",
      data: credit,
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error in updating plan",
      error: error.message,
    })
  }
}

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const credit = await cancelUserSubscription(userId);

    res.status(200).json({
      success: true,
      message: "subscription cancellation successfully",
      data: credit,
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error in canceling subscription",
      error: error.message,
    })
  }
}

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getUserStatistics(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
}
