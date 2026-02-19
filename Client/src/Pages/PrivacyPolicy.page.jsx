import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050816] text-white/80 font-sans selection:bg-violet-500/30">
            <div className="max-w-4xl mx-auto px-6 py-20">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-sm font-medium hover:text-white transition-colors"
                >
                    ← Back
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-syne tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-white/40 mb-12">Last Updated: February 19, 2026</p>

                    <section className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
                            <p className="leading-relaxed">
                                Welcome to Skull Bot. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
                            <p className="leading-relaxed mb-4">
                                We collect information that you provide directly to us, such as when you create an account, or contact us for support:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Account Information: Name, email address, and login credentials.</li>
                                <li>Usage Data: Information about how you use our service, including prompts and generated content.</li>
                                <li>Device Information: IP address, browser type, and operating system.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                            <p className="leading-relaxed mb-4">
                                We use the collected information for various purposes, including:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>To provide and maintain our Service.</li>
                                <li>To notify you about changes to our Service.</li>
                                <li>To provide customer support.</li>
                                <li>To gather analysis or valuable information so that we can improve our Service.</li>
                                <li>To monitor the usage of our Service.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">4. Cookies and Tracking</h2>
                            <p className="leading-relaxed">
                                We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. For more details, please see our Cookie Policy.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">5. Data Security</h2>
                            <p className="leading-relaxed">
                                The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">6. Contact Us</h2>
                            <p className="leading-relaxed">
                                If you have any questions about this Privacy Policy, please contact us at support@skullbot.ai
                            </p>
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
