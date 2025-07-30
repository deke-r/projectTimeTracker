"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Plus, Trash2, BarChart3, Calendar, Send, FileText, Loader2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProjectTimeTracker() {
  const [userName, setUserName] = useState("")
  const [projects, setProjects] = useState([])
  const [projectForms, setProjectForms] = useState([{ name: "", description: "", startTime: "", endTime: "" }])
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // Generate time options from 9:30 AM to 6:30 PM
  const generateTimeOptions = () => {
    const times = []
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 9 && minute < 30) continue
        if (hour === 18 && minute > 30) continue

        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        times.push({ value: timeString, label: displayTime })
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    return (end.getTime() - start.getTime()) / (1000 * 60) // Duration in minutes
  }

  const addProject = (index) => {
    const form = projectForms[index]
    if (!form.name || !form.startTime || !form.endTime) return

    const duration = calculateDuration(form.startTime, form.endTime)
    if (duration <= 0) {
      toast({
        title: "Invalid Time",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    const newProject = {
      id: Date.now().toString(),
      name: form.name,
      description: form.description,
      startTime: form.startTime,
      endTime: form.endTime,
      date: new Date().toISOString().split("T")[0],
      duration,
    }

    setProjects([...projects, newProject])

    // Reset current form and add new empty form
    const newForms = [...projectForms]
    newForms[index] = { name: "", description: "", startTime: "", endTime: "" }
    newForms.push({ name: "", description: "", startTime: "", endTime: "" })
    setProjectForms(newForms)
  }

  const updateProjectForm = (index, field, value) => {
    const newForms = [...projectForms]
    newForms[index] = { ...newForms[index], [field]: value }
    setProjectForms(newForms)
  }

  const removeProject = (projectId) => {
    setProjects(projects.filter((p) => p.id !== projectId))
  }

  const removeProjectForm = (index) => {
    if (projectForms.length > 1) {
      const newForms = projectForms.filter((_, i) => i !== index)
      setProjectForms(newForms)
    }
  }

  // Analytics calculations
  const totalProjects = projects.length
  const totalTimeMinutes = projects.reduce((sum, project) => sum + project.duration, 0)
  const averageTimeMinutes = totalProjects > 0 ? totalTimeMinutes / totalProjects : 0

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const generateAndSendReport = async (format) => {
    if (!userName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name before generating the report",
        variant: "destructive",
      })
      return
    }

    if (projects.length === 0) {
      toast({
        title: "No Projects",
        description: "Please add at least one project before generating the report",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Show loading toast
    const loadingToast = toast({
      title: "Generating Report...",
      description: `Please wait while we generate and send your ${format.toUpperCase()} report`,
    })

    try {
      const reportData = {
        userName,
        date: new Date().toLocaleDateString(),
        projects: projects.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        stats: {
          totalProjects,
          totalTime: formatDuration(totalTimeMinutes),
          averageTime: formatDuration(Math.round(averageTimeMinutes)),
          totalTimeMinutes,
        },
        format,
      }

      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      })

      const result = await response.json()

      if (response.ok) {
        // Dismiss loading toast and show success
        loadingToast.dismiss()
        toast({
          title: "✅ Report Sent Successfully!",
          description: `${format.toUpperCase()} report has been generated and sent to HR manager. You will receive a confirmation email shortly.`,
        })
      } else {
        throw new Error(result.error || "Failed to generate report")
      }
    } catch (error) {
      // Dismiss loading toast and show error
      loadingToast.dismiss()
      toast({
        title: "❌ Error",
        description: error.message || "Failed to generate and send report",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Project Time Tracker
            </CardTitle>
            <CardDescription>Track your daily projects and analyze your work patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="userName">Your Name</Label>
              <Input
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Project Entry Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Add Projects</CardTitle>
            <CardDescription>Office hours: 9:30 AM - 6:30 PM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {projectForms.map((form, index) => (
              <div key={index} className="p-4 border rounded-lg bg-white/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      placeholder="Enter project name"
                      value={form.name}
                      onChange={(e) => updateProjectForm(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select
                      value={form.startTime}
                      onValueChange={(value) => updateProjectForm(index, "startTime", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select value={form.endTime} onValueChange={(value) => updateProjectForm(index, "endTime", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={() => addProject(index)}
                      disabled={!form.name || !form.startTime || !form.endTime}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                    {projectForms.length > 1 && (
                      <Button variant="outline" size="icon" onClick={() => removeProjectForm(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Enter project description"
                    value={form.description}
                    onChange={(e) => updateProjectForm(index, "description", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Generate Report Section */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Report
              </CardTitle>
              <CardDescription>Generate and automatically send your daily report to HR manager</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={() => generateAndSendReport("pdf")}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isGenerating ? "Generating PDF..." : "Generate PDF Report"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateAndSendReport("html")}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isGenerating ? "Generating HTML..." : "Generate HTML Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Dashboard */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(totalTimeMinutes)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Time</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(Math.round(averageTimeMinutes))}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeline */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>
                {userName && `${userName}'s `}Daily project timeline for {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((project, index) => (
                    <div key={project.id} className="relative">
                      {index > 0 && <Separator className="mb-4" />}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {formatTime(project.startTime)} - {formatTime(project.endTime)}
                            </Badge>
                            <Badge variant="secondary">{formatDuration(project.duration)}</Badge>
                          </div>
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(project.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {projects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects added yet</h3>
              <p className="text-muted-foreground">
                Start by adding your first project above to see your timeline and analytics.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
