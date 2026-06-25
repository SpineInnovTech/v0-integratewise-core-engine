"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Calendar, Star, Sparkles, Save } from "lucide-react"

export function ProfileView() {
  const [activeTab, setActiveTab] = useState("personal")
  const [name, setName] = useState("Demo User")
  const [email, setEmail] = useState("demo@integratewise.online")
  const [dob, setDob] = useState("1990-01-15")

  // Numerology calculations (simplified)
  const calculateLifePath = (dateStr: string) => {
    const digits = dateStr.replace(/-/g, "").split("").map(Number)
    let sum = digits.reduce((a, b) => a + b, 0)
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = sum
        .toString()
        .split("")
        .map(Number)
        .reduce((a, b) => a + b, 0)
    }
    return sum
  }

  const lifePath = calculateLifePath(dob)

  const lifePathMeanings: Record<number, { title: string; traits: string[] }> = {
    1: { title: "The Leader", traits: ["Independent", "Innovative", "Ambitious"] },
    2: { title: "The Mediator", traits: ["Diplomatic", "Cooperative", "Intuitive"] },
    3: { title: "The Communicator", traits: ["Creative", "Expressive", "Optimistic"] },
    4: { title: "The Builder", traits: ["Practical", "Organized", "Dedicated"] },
    5: { title: "The Explorer", traits: ["Adventurous", "Versatile", "Dynamic"] },
    6: { title: "The Nurturer", traits: ["Responsible", "Caring", "Harmonious"] },
    7: { title: "The Seeker", traits: ["Analytical", "Spiritual", "Introspective"] },
    8: { title: "The Achiever", traits: ["Ambitious", "Authoritative", "Successful"] },
    9: { title: "The Humanitarian", traits: ["Compassionate", "Generous", "Idealistic"] },
    11: { title: "The Visionary", traits: ["Inspirational", "Intuitive", "Enlightened"] },
    22: { title: "The Master Builder", traits: ["Visionary", "Practical", "Powerful"] },
    33: { title: "The Master Teacher", traits: ["Selfless", "Nurturing", "Spiritual"] },
  }

  const meaning = lifePathMeanings[lifePath] || lifePathMeanings[1]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and personal insights</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/diverse-user-avatars.png" />
                <AvatarFallback className="text-2xl">DU</AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">Free Tier</Badge>
                <Badge variant="outline">Life Path {lifePath}</Badge>
              </div>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                <User className="h-4 w-4 mr-2" />
                Edit Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="insights">Personal Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Used to calculate your personal insights</p>
                  </div>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-4 space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>
                        Life Path {lifePath}: {meaning.title}
                      </CardTitle>
                      <CardDescription>Your numerological profile based on your birth date</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {meaning.traits.map((trait) => (
                      <Badge key={trait} variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Starting Path</CardTitle>
                  <CardDescription>Based on your life path number</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lifePath <= 3 && (
                      <>
                        <p className="text-sm">
                          As a <strong>{meaning.title}</strong>, you thrive with creative and communicative tasks.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Start with Brainstorming to capture your ideas, then use the Loader to organize them into
                          actionable tasks.
                        </p>
                      </>
                    )}
                    {lifePath > 3 && lifePath <= 6 && (
                      <>
                        <p className="text-sm">
                          As a <strong>{meaning.title}</strong>, you excel at organization and building systems.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Start with the Loader to import your existing data, then use Tasks to create structured
                          workflows.
                        </p>
                      </>
                    )}
                    {lifePath > 6 && (
                      <>
                        <p className="text-sm">
                          As a <strong>{meaning.title}</strong>, you have natural analytical and strategic abilities.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Start with Insights to understand patterns in your data, then use Brainstorming for strategic
                          planning.
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
