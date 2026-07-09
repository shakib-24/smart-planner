"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WeeklyDataPoint = { date: string; completed: number; total: number };

type DashboardStats = {
  todayCount: number;
  pendingCount: number;
  completedCount: number;
  upcomingCount: number;
  overdueCount: number;
  weeklyData: WeeklyDataPoint[];
  monthlyCompletionRate: number;
};

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardView({ stats }: { stats: DashboardStats }) {
  const t = useTranslations("tasks");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // The app's --chart-* CSS vars are identical across light/dark (grayscale
  // placeholders never customized per-theme), so a var()-only fill would be
  // barely visible in one mode or the other. Pick explicit, contrast-checked
  // colors per theme instead.
  const isDark = mounted && resolvedTheme === "dark";
  const completedColor = isDark ? "#4ade80" : "#16a34a";
  const totalColor = isDark ? "#60a5fa" : "#3b82f6";

  const chartData = stats.weeklyData.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(locale, { weekday: "short" }),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label={t("todayTasks")}
          value={stats.todayCount}
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <StatCard
          label={t("pending")}
          value={stats.pendingCount}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label={t("completed")}
          value={stats.completedCount}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          label={t("upcoming")}
          value={stats.upcomingCount}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label={t("overdue")}
          value={stats.overdueCount}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("weeklyProgress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--border)" tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--border)"
                  tick={{ fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    color: "var(--popover-foreground)",
                  }}
                  labelStyle={{ color: "var(--popover-foreground)" }}
                />
                <Legend wrapperStyle={{ color: "var(--muted-foreground)" }} />
                <Bar dataKey="total" name={t("totalTasks")} fill={totalColor} radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="completed"
                  name={t("completed")}
                  fill={completedColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("monthlyCompletionRate")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
            <p className="text-5xl font-bold">{stats.monthlyCompletionRate}%</p>
            <p className="text-sm text-muted-foreground text-center">
              {t("monthlyCompletionRate")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
