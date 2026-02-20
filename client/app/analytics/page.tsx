"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3005";

export default function AnalyticsPage() {
  const [commandStats, setCommandStats] = useState([]);
  const [apiStats, setApiStats] = useState([]);
  const [commandTimeline, setCommandTimeline] = useState([]);
  const [apiTimeline, setApiTimeline] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString());

      const [commands, apiCalls, cmdTimeline, apiTime] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/commands?${params}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/analytics/api-calls?${params}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/analytics/command-timeline?${params}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/analytics/api-timeline?${params}`, { credentials: 'include' }).then(r => r.json()),
      ]);

      setCommandStats(commands);
      setApiStats(apiCalls);
      setCommandTimeline(cmdTimeline);
      setApiTimeline(apiTime);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const commandFrequency = commandStats.reduce((acc, stat) => {
    const existing = acc.find(item => item.command === stat.command);
    if (existing) {
      existing.count += stat._count;
    } else {
      acc.push({ command: stat.command, count: stat._count });
    }
    return acc;
  }, []);

  const successFailureData = commandStats.map(stat => ({
    name: `${stat.command} (${stat.status})`,
    value: stat._count,
    status: stat.status,
  }));

  const apiCallsByModel = apiStats.reduce((acc, stat) => {
    const existing = acc.find(item => item.model === stat.model);
    if (existing) {
      const newAvg = (existing.avgDuration * existing.count + (stat._avg.duration || 0) * stat._count) / (existing.count + stat._count);
      existing.count += stat._count;
      existing.avgDuration = newAvg;
    } else {
      acc.push({ 
        model: stat.model, 
        count: stat._count,
        avgDuration: stat._avg.duration || 0,
      });
    }
    return acc;
  }, []);

  const totalApiCalls = apiStats.reduce((sum, stat) => sum + stat._count, 0);
  const successfulCalls = apiStats.filter(s => s.status === "success").reduce((sum, stat) => sum + stat._count, 0);
  const successRate = totalApiCalls > 0 ? ((successfulCalls / totalApiCalls) * 100).toFixed(1) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                "Pick a date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {commandStats.reduce((sum, stat) => sum + stat._count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalApiCalls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{successRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commands" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commands">Commands</TabsTrigger>
          <TabsTrigger value="api">API Calls</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="commands" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Command Frequency</CardTitle>
                <CardDescription>Most used CLI commands</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={commandFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="command" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success vs Failure</CardTitle>
                <CardDescription>Command execution results</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={successFailureData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {successFailureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.status === "success" ? "#00C49F" : "#FF8042"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>API Calls by Model</CardTitle>
                <CardDescription>Distribution across models</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={apiCallsByModel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Response Time</CardTitle>
                <CardDescription>By model (milliseconds)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={apiCallsByModel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgDuration" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 100 commands and API calls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {commandTimeline.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <span className="font-medium">{log.command}</span>
                      <span className={`ml-2 text-sm ${log.status === "success" ? "text-green-600" : "text-red-600"}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {log.duration}ms • {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
