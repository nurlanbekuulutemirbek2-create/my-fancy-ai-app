"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Settings,
  Shield,
  Palette,
  Bell,
  Moon,
  Sun,
  Globe,
  Camera,
  Edit,
  Save,
  Trophy,
  Star,
  Zap,
  ImageIcon,
  Mic,
  FileText,
  Bot,
} from "lucide-react"

interface UserStats {
  imagesCreated: number
  voiceNotes: number
  smartNotes: number
  aiConversations: number
  filesUploaded: number
  videosWatched: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

export function UserProfile() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: "Alex Johnson",
    email: "alex@example.com",
    bio: "Creative enthusiast exploring the digital wonderland!",
    avatar: "/friendly-user-avatar.jpg",
    joinDate: new Date("2024-01-15"),
  })

  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "en",
    notifications: true,
    emailUpdates: false,
    autoSave: true,
    aiAssistance: true,
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    lastPasswordChange: new Date("2024-01-20"),
    loginSessions: 3,
  })

  const userStats: UserStats = {
    imagesCreated: 1234,
    voiceNotes: 567,
    smartNotes: 890,
    aiConversations: 42,
    filesUploaded: 156,
    videosWatched: 89,
  }

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Steps",
      description: "Created your first AI image",
      icon: <ImageIcon className="h-5 w-5" />,
      unlocked: true,
    },
    {
      id: "2",
      title: "Voice Master",
      description: "Record 100 voice notes",
      icon: <Mic className="h-5 w-5" />,
      unlocked: true,
      progress: 567,
      maxProgress: 100,
    },
    {
      id: "3",
      title: "Note Taker",
      description: "Create 500 smart notes",
      icon: <FileText className="h-5 w-5" />,
      unlocked: false,
      progress: 890,
      maxProgress: 500,
    },
    {
      id: "4",
      title: "AI Whisperer",
      description: "Have 50 AI conversations",
      icon: <Bot className="h-5 w-5" />,
      unlocked: false,
      progress: 42,
      maxProgress: 50,
    },
    {
      id: "5",
      title: "Creative Genius",
      description: "Use all AI tools in one day",
      icon: <Zap className="h-5 w-5" />,
      unlocked: true,
    },
  ]

  const handleSaveProfile = () => {
    setIsEditing(false)
    // In real app, this would save to backend
    console.log("Profile saved:", userInfo)
  }

  const handlePreferenceChange = (key: string, value: string | boolean | number) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const toggleTwoFactor = () => {
    setSecurity((prev) => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
  }

  return (
    <div className="h-full space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={userInfo.avatar || "/placeholder.svg"} alt={userInfo.name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary text-white">
                  {userInfo.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 hover:scale-110 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{userInfo.name}</h2>
                <Badge variant="secondary" className="animate-pulse-soft">
                  <Star className="h-3 w-3 mr-1" />
                  Pro User
                </Badge>
              </div>
              <p className="text-muted-foreground mb-2">{userInfo.email}</p>
              <p className="text-sm">{userInfo.bio}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Member since {userInfo.joinDate.toLocaleDateString()}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {Object.values(userStats).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Activities</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="rounded-lg">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-lg">
            <Trophy className="h-4 w-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                    className="rounded-lg"
                  >
                    {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={userInfo.bio}
                    onChange={(e) => setUserInfo((prev) => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    className="rounded-lg"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Your creative journey in numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-primary">{userStats.imagesCreated}</div>
                    <div className="text-sm text-muted-foreground">Images Created</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <Mic className="h-8 w-8 mx-auto mb-2 text-secondary" />
                    <div className="text-2xl font-bold text-secondary">{userStats.voiceNotes}</div>
                    <div className="text-sm text-muted-foreground">Voice Notes</div>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-accent" />
                    <div className="text-2xl font-bold text-accent">{userStats.smartNotes}</div>
                    <div className="text-sm text-muted-foreground">Smart Notes</div>
                  </div>
                  <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                    <Bot className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold text-purple-500">{userStats.aiConversations}</div>
                    <div className="text-sm text-muted-foreground">AI Chats</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={preferences.theme} onValueChange={(value) => handlePreferenceChange("theme", value)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Auto
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => handlePreferenceChange("language", value)}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications & Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications & Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified about important updates</p>
                  </div>
                  <Switch
                    checked={preferences.notifications}
                    onCheckedChange={(checked) => handlePreferenceChange("notifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive weekly progress reports</p>
                  </div>
                  <Switch
                    checked={preferences.emailUpdates}
                    onCheckedChange={(checked) => handlePreferenceChange("emailUpdates", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Save</Label>
                    <p className="text-sm text-muted-foreground">Automatically save your work</p>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => handlePreferenceChange("autoSave", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>AI Assistance</Label>
                    <p className="text-sm text-muted-foreground">Enable smart suggestions and insights</p>
                  </div>
                  <Switch
                    checked={preferences.aiAssistance}
                    onCheckedChange={(checked) => handlePreferenceChange("aiAssistance", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Keep your account safe and secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch checked={security.twoFactorEnabled} onCheckedChange={toggleTwoFactor} />
                </div>
                <div className="space-y-2">
                  <Label>Change Password</Label>
                  <Button variant="outline" className="w-full rounded-lg bg-transparent">
                    Update Password
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Last changed: {security.lastPasswordChange.toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Active Sessions</Label>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Current device sessions</span>
                    <Badge variant="secondary">{security.loginSessions}</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                    Manage Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
                <CardDescription>Manage your account data and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full rounded-lg bg-transparent">
                  Download My Data
                </Button>
                <Button variant="outline" className="w-full rounded-lg bg-transparent">
                  Export Settings
                </Button>
                <Button variant="outline" className="w-full rounded-lg bg-transparent">
                  Privacy Settings
                </Button>
                <div className="pt-4 border-t">
                  <Button variant="destructive" className="w-full rounded-lg">
                    Delete Account
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">This action cannot be undone</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Achievements & Badges
              </CardTitle>
              <CardDescription>Track your progress and unlock new milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`transition-all duration-300 ${
                      achievement.unlocked
                        ? "border-yellow-500/50 bg-yellow-500/5 hover:shadow-lg"
                        : "border-muted hover:border-primary/30"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            achievement.unlocked ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                          {achievement.progress !== undefined && achievement.maxProgress && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>
                                  {achievement.progress}/{achievement.maxProgress}
                                </span>
                              </div>
                              <Progress
                                value={(achievement.progress / achievement.maxProgress) * 100}
                                className="h-2"
                              />
                            </div>
                          )}
                          {achievement.unlocked && (
                            <Badge variant="secondary" className="text-xs mt-2">
                              <Star className="h-3 w-3 mr-1" />
                              Unlocked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
