"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to{" "}
            <span className="text-brand">IntegrateWise</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Let&apos;s set up your personalized workspace in just a few steps
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="h-2 w-16 rounded-full bg-brand" />
          <div className="h-2 w-16 rounded-full bg-muted" />
          <div className="h-2 w-16 rounded-full bg-muted" />
          <div className="h-2 w-16 rounded-full bg-muted" />
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Card className="border-brand/20">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                <Sparkles className="h-5 w-5 text-brand" />
              </div>
              <CardTitle className="text-lg">AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Intelligent insights from your browser activity to personalize your workspace
              </p>
            </CardContent>
          </Card>

          <Card className="border-brand/20">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                <Shield className="h-5 w-5 text-brand" />
              </div>
              <CardTitle className="text-lg">Privacy First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your data stays secure with end-to-end encryption and local processing
              </p>
            </CardContent>
          </Card>

          <Card className="border-brand/20">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                <Zap className="h-5 w-5 text-brand" />
              </div>
              <CardTitle className="text-lg">Three Lenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Personal, Business, or Customer Success - we&apos;ll help you pick the right view
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button size="lg" className="btn-brand" asChild>
            <Link href="/connect">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Takes about 2 minutes to set up
          </p>
        </div>

        {/* Skip option */}
        <div className="mt-8 text-center">
          <Link 
            href="/personal/home" 
            className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Skip for now and explore
          </Link>
        </div>
      </div>
    </div>
  );
}
