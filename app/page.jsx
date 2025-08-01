"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Plus, Trash2, BarChart3, Calendar, Send, FileText, Loader2, CheckCircle, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProjectTimeTracker() {
  const [projects, setProjects] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      userName: "",
      userEmail: "",
      selectedDate: new Date().toISOString().split("T")[0],
      projectForm: { name: "", startTime: "", endTime: "", description: "" },
    },
  })

  // Watch form values for real-time validation
  const watchedValues = watch()

  // Generate time options from 9:00 AM to 9:00 PM with 15-minute intervals
  const generateTimeOptions = () => {
    const times = []
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        // Skip times after 9:00 PM (21:00)
        if (hour === 21 && minute > 0) continue

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

  const addProject = () => {
    const form = watchedValues.projectForm
    if (!form.name || !form.startTime || !form.endTime || !form.description) return

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
      date: watchedValues.selectedDate,
      duration,
    }

    setProjects([...projects, newProject])

    // Reset the form for next entry
    setValue("projectForm.name", "")
    setValue("projectForm.startTime", "")
    setValue("projectForm.endTime", "")
    setValue("projectForm.description", "")
  }

  const removeProject = (projectId) => {
    setProjects(projects.filter((p) => p.id !== projectId))
  }

  const removeProjectForm = (index) => {
    if (fields.length > 1) {
      remove(index)
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const generateAndSendReport = async () => {
    if (!watchedValues.userName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name before sending the report",
        variant: "destructive",
      })
      return
    }

    if (projects.length === 0) {
      toast({
        title: "No Projects",
        description: "Please add at least one project before sending the report",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Show loading toast
    const loadingToast = toast({
      title: "Sending Report...",
      description: "Please wait while we send your daily report",
    })

    try {
      const reportData = {
        userName: watchedValues.userName,
        date: formatDate(watchedValues.selectedDate),
        projects: projects.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        stats: {
          totalProjects,
          totalTime: formatDuration(totalTimeMinutes),
          averageTime: formatDuration(Math.round(averageTimeMinutes)),
          totalTimeMinutes,
        },
        additionalEmail: watchedValues.userEmail.trim() || undefined,
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
        
        // Show different success messages based on whether email was provided
        const successMessage = watchedValues.userEmail.trim() 
          ? `Daily report has been sent to HR manager and your email (${watchedValues.userEmail}). You will receive a confirmation email shortly.`
          : `Daily report has been sent to HR manager. You will receive a confirmation email shortly.`
        
        toast({
          title: "✅ Report Sent Successfully!",
          description: successMessage,
        })

        // Clear the form after successful generation
        setProjects([])
        setValue("projectForm.name", "")
        setValue("projectForm.startTime", "")
        setValue("projectForm.endTime", "")
        setValue("projectForm.description", "")
      } else {
        throw new Error(result.error || "Failed to send report")
      }
    } catch (error) {
      // Dismiss loading toast and show error
      loadingToast.dismiss()
      toast({
        title: "❌ Error",
        description: error.message || "Failed to send report",
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
              Sense Time Tracker
            </CardTitle>
            <CardDescription>Track your daily projects and analyze your work patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name *</Label>
                <Input
                  id="userName"
                  placeholder="Enter your name"
                  {...register("userName", { 
                    required: "Name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" }
                  })}
                  className={errors.userName ? "border-red-500" : ""}
                />
                {errors.userName && (
                  <p className="text-sm text-red-500">{errors.userName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Your Email (Optional)
                  </div>
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="your.email@company.com"
                  {...register("userEmail", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address"
                    }
                  })}
                  className={errors.userEmail ? "border-red-500" : ""}
                />
                {errors.userEmail && (
                  <p className="text-sm text-red-500">{errors.userEmail.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  If provided, you'll receive a copy of the report
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="selectedDate">Date</Label>
                <Input
                  id="selectedDate"
                  type="date"
                  {...register("selectedDate", { required: "Date is required" })}
                  className={errors.selectedDate ? "border-red-500" : ""}
                />
                {errors.selectedDate && (
                  <p className="text-sm text-red-500">{errors.selectedDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Entry Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Add Projects</CardTitle>
            <CardDescription>
              Office hours: 9:00 AM - 9:00 PM • Date: {formatDate(watchedValues.selectedDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg bg-white/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <Input
                    placeholder="Enter project name"
                    {...register("projectForm.name", { 
                      required: "Project name is required",
                      minLength: { value: 2, message: "Project name must be at least 2 characters" }
                    })}
                    className={errors.projectForm?.name ? "border-red-500" : ""}
                  />
                  {errors.projectForm?.name && (
                    <p className="text-sm text-red-500">{errors.projectForm.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Select
                    value={watchedValues.projectForm?.startTime || ""}
                    onValueChange={(value) => setValue("projectForm.startTime", value)}
                  >
                    <SelectTrigger className={errors.projectForm?.startTime ? "border-red-500" : ""}>
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
                  {errors.projectForm?.startTime && (
                    <p className="text-sm text-red-500">{errors.projectForm.startTime.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Select 
                    value={watchedValues.projectForm?.endTime || ""}
                    onValueChange={(value) => setValue("projectForm.endTime", value)}
                  >
                    <SelectTrigger className={errors.projectForm?.endTime ? "border-red-500" : ""}>
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
                  {errors.projectForm?.endTime && (
                    <p className="text-sm text-red-500">{errors.projectForm.endTime.message}</p>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={addProject}
                    disabled={!watchedValues.projectForm?.name || 
                             !watchedValues.projectForm?.startTime || 
                             !watchedValues.projectForm?.endTime ||
                             !watchedValues.projectForm?.description}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Enter project description"
                  {...register("projectForm.description", {
                    required: "Description is required",
                    minLength: { value: 10, message: "Description must be at least 10 characters" }
                  })}
                  rows={2}
                  className={errors.projectForm?.description ? "border-red-500" : ""}
                />
                {errors.projectForm?.description && (
                  <p className="text-sm text-red-500">{errors.projectForm.description.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Report Section */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Send Report
              </CardTitle>
              <CardDescription>Send your daily report to HR manager via email</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateAndSendReport()}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isGenerating ? "Sending Report..." : "Send Daily Report"}
              </Button>
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
                {watchedValues.userName && `${watchedValues.userName}'s `}Daily project timeline for {formatDate(watchedValues.selectedDate)}
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
                          <p className="text-muted-foreground mt-1">{project.description}</p>
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
