const cron = require('node-cron');
const {
    resetDailyCredits,
    resetMonthlyCredits
} = require('../services/credit.service');

cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Starting daily credit reset...');
    await resetDailyCredits();
});

cron.schedule('5 0 1 * *', async () => {
    console.log('[CRON] Starting monthly credit reset...');
    await resetMonthlyCredits();
});
