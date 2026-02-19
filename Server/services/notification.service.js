/**
 * NOTIFICATION SERVICE
 * 
 * Service for sending notifications and alerts
 * 
 * @module services/notification.service
 */

const nodemailer = require('nodemailer');
const env = require('../config/env.config');
const logger = require('../utils/logger.utils');

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

class NotificationService {
    constructor() {
        // Initialize Transporter safely
        if (env.smtp.user && env.smtp.pass) {
            this.transporter = nodemailer.createTransport({
                host: env.smtp.host,
                port: env.smtp.port,
                secure: env.smtp.port === 465,
                auth: {
                    user: env.smtp.user,
                    pass: env.smtp.pass,
                },
            });

            this.transporter.verify((error) => {
                if (error) {
                    logger.error('❌ SMTP Connection Error:', error);
                } else {
                    logger.info('✅ SMTP Server is ready to send emails');
                }
            });
        } else {
            console.log('\n' + '='.repeat(60));
            console.log('⚠️  EMAIL DELIVERY ADVISORY');
            console.log('SMTP credentials not found in Server/.env');
            console.log('Real email delivery is currently DISABLED.');
            console.log('OTPs will only be logged to THIS TERMINAL.');
            console.log('='.repeat(60) + '\n');

            this.transporter = {
                sendMail: async () => {
                    throw new Error('SMTP not configured');
                }
            };
        }
    }

    /**
     * Send email notification
     * @param {Object} options - Email options (to, subject, text, html)
     * @returns {Promise<void>}
     */
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: env.smtp.from || '"Skull Bot" <no-reply@skullbot.com>',
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info('📧 Email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            logger.error('❌ Error sending email:', error);
            throw error; // Let the caller handle it if needed
        }
    }

    /**
     * Send alert notification
     * @param {Object} alertData - Alert data
     */
    async sendAlert(alertData) {
        try {
            logger.warn('🚨 ALERT:', alertData);
        } catch (error) {
            logger.error('Error sending alert:', error);
        }
    }

    /**
     * Send Slack notification
     */
    async sendSlackMessage(data) {
        logger.info('💬 Slack notification would be sent:', data);
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const notificationService = new NotificationService();

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = notificationService;