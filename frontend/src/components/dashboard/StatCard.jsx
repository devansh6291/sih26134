import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ title, value, change, icon: Icon, tone = "blue" }) {
  return (
    <motion.div
      className="stat-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="stat-head">
        <span>{title}</span>
        <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-change">{change}</div>
    </motion.div>
  );
}