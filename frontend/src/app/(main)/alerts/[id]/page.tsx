"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Sparkles, AlertTriangle, ShieldAlert, CheckCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AIExplanation {
  explanation: string | null;
  risk_level: string | null;
  recommended_actions: string[];
  fallback: boolean;
  fallback_reason?: string;
}

export default function AlertDetailPage({ params }: { params: { id: string } }) {
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAIExplanation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8080/api/v1/ai/explain/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setExplanation(data);
        } else {
          throw new Error("Failed to fetch explanation");
        }
      } catch (err) {
        setExplanation({
          explanation: "Failed to connect to the backend AI service. Falling back to default analysis.",
          risk_level: "high",
          recommended_actions: ["Investigate locally", "Check back later"],
          fallback: true,
          fallback_reason: "Network Error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAIExplanation();
  }, [params.id]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Link href="/alerts" className={cn(buttonVariants({ variant: "outline", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Alert Details</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Mock Alert Metadata Card */}
        <Card className="md:col-span-4 h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                high_cpu
              </CardTitle>
            </div>
            <CardDescription className="font-mono text-xs mt-2">
              Device: device-1
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Severity</p>
                <Badge variant="destructive" className="bg-rose-500">High</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="destructive" className="bg-rose-500/20 text-rose-500 border-none">Open</Badge>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Detected At</p>
                <p className="text-sm font-mono">{new Date().toISOString()}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button className="w-full">Mark as Investigating</Button>
              <Button variant="outline" className="w-full mt-2 text-emerald-500 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-500/10">Mark as Resolved</Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Explanation Card */}
        <Card className="md:col-span-8 bg-gradient-to-b from-card to-card/50 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <CardTitle>AI Explanation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            ) : explanation?.fallback ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <ShieldAlert className="h-12 w-12 mb-4 text-muted-foreground/50" />
                <p className="font-medium text-lg">AI Unavailable</p>
                <p className="text-sm">{explanation.fallback_reason}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Analysis</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {explanation?.explanation}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg mb-2">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {explanation?.recommended_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 bg-muted/30 p-3 rounded-md">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
