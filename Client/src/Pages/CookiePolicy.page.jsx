import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CookiePolicy = () => {
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
                        Cookie Policy
                    </h1>
                    <p className="text-white/40 mb-12">Last Updated: February 19, 2026</p>

                    <section className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">1. What are Cookies?</h2>
                            <p className="leading-relaxed">
                                Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">2. How Skull Bot Uses Cookies</h2>
                            <p className="leading-relaxed mb-4">
                                When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>To enable certain functions of the Service.</li>
                                <li>To provide analytics.</li>
                                <li>To store your preferences.</li>
                                <li>To enable advertisement delivery, including behavioral advertising.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">3. Types of Cookies We Use</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Essential Cookies:</strong> Used to authenticate users and prevent fraudulent use of user accounts.</li>
                                <li><strong>Preference Cookies:</strong> Used to remember information that changes the way the service behaves or looks.</li>
                                <li><strong>Analytics Cookies:</strong> Used to track information how the Service is used so that we can make improvements.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">4. Your Choices Regarding Cookies</h2>
                            <p className="leading-relaxed">
                                If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">5. More Information</h2>
                            <p className="leading-relaxed">
                                For more information regarding your privacy, please visit our Privacy Policy.
                            </p>
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
};

export default CookiePolicy;
