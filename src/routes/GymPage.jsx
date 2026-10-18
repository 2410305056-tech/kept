import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { Tabs } from "../components/ui/Tabs.jsx";
import { GymToday } from "../gym/GymToday.jsx";
import { GymPlan } from "../gym/GymPlan.jsx";
import { GymLog } from "../gym/GymLog.jsx";
import { GymProgress } from "../gym/GymProgress.jsx";
import { BodyTab } from "../gym/BodyTab.jsx";
import { FuelTab } from "../gym/FuelTab.jsx";
import { FeesTab } from "../gym/FeesTab.jsx";

export function GymPage() {
  const [state] = useStore();
  const { today, now } = useNow();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

  const [activeTab, setActiveTab] = useState("today");

  // Fuel badge after 20:00 if post-gym meal is unchecked
  const todayFuel = state.fuelLogs.find((f) => f.date === today);
  const showFuelBadge = now.getHours() >= 20 && (!todayFuel || !todayFuel.postGymMeal);

  const tabs = [
    { id: "today", label: "Today" },
    { id: "plan", label: "Plan" },
    { id: "log", label: "Log" },
    { id: "progress", label: "Progress" },
    { id: "body", label: "Body" },
    { id: "fuel", label: "Fuel", badge: showFuelBadge ? "alert" : null },
    { id: "fees", label: "Fees" },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 overflow-x-auto">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "today" && <GymToday dateOverride={dateParam} />}
        {activeTab === "plan" && <GymPlan />}
        {activeTab === "log" && <GymLog />}
        {activeTab === "progress" && <GymProgress />}
        {activeTab === "body" && <BodyTab />}
        {activeTab === "fuel" && <FuelTab />}
        {activeTab === "fees" && <FeesTab />}
      </div>
    </div>
  );
}
