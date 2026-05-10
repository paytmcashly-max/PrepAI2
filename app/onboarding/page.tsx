"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { BookOpen, Target, Clock, Calendar, ArrowRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, title: "Welcome", icon: BookOpen },
  { id: 2, title: "Target Exam", icon: Target },
  { id: 3, title: "Study Plan", icon: Clock },
  { id: 4, title: "Start Date", icon: Calendar },
]

const exams = [
  { id: "ssc-cgl", name: "SSC CGL", description: "Combined Graduate Level Examination" },
  { id: "ssc-chsl", name: "SSC CHSL", description: "Combined Higher Secondary Level" },
  { id: "ssc-mts", name: "SSC MTS", description: "Multi Tasking Staff" },
  { id: "upsc-cse", name: "UPSC CSE", description: "Civil Services Examination" },
  { id: "bank-po", name: "Bank PO", description: "Probationary Officer Exams" },
]

const studyHoursOptions = [
  { value: "2", label: "2 hours", description: "Light preparation" },
  { value: "4", label: "4 hours", description: "Balanced approach" },
  { value: "6", label: "6 hours", description: "Intensive study" },
  { value: "8", label: "8+ hours", description: "Full-time preparation" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    examTarget: "",
    dailyStudyHours: "4",
    startDate: new Date().toISOString().split("T")[0],
  })

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            full_name: formData.fullName,
            exam_target: formData.examTarget,
            daily_study_hours: parseInt(formData.dailyStudyHours),
            start_date: formData.startDate,
            updated_at: new Date().toISOString(),
          })

        if (error) {
          console.error("Error updating profile:", error)
        }
      }

      router.push("/dashboard")
    } catch (error) {
      console.error("Onboarding error:", error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName.trim().length > 0
      case 2:
        return formData.examTarget.length > 0
      case 3:
        return formData.dailyStudyHours.length > 0
      case 4:
        return formData.startDate.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep > step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-2 transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">
              {currentStep === 1 && "Welcome to PrepTrack"}
              {currentStep === 2 && "Select Your Target Exam"}
              {currentStep === 3 && "Daily Study Hours"}
              {currentStep === 4 && "When do you want to start?"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Let's personalize your preparation journey"}
              {currentStep === 2 && "Choose the exam you're preparing for"}
              {currentStep === 3 && "How many hours can you dedicate daily?"}
              {currentStep === 4 && "We'll create your personalized 180-day roadmap"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Step 1: Welcome & Name */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                    <BookOpen className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Your AI-powered study companion for competitive exam success
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">What should we call you?</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="text-lg py-6"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Target Exam */}
            {currentStep === 2 && (
              <RadioGroup
                value={formData.examTarget}
                onValueChange={(value) => setFormData({ ...formData, examTarget: value })}
                className="grid gap-3"
              >
                {exams.map((exam) => (
                  <Label
                    key={exam.id}
                    htmlFor={exam.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      formData.examTarget === exam.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <RadioGroupItem value={exam.id} id={exam.id} className="sr-only" />
                    <div className="flex-1">
                      <div className="font-semibold">{exam.name}</div>
                      <div className="text-sm text-muted-foreground">{exam.description}</div>
                    </div>
                    {formData.examTarget === exam.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </Label>
                ))}
              </RadioGroup>
            )}

            {/* Step 3: Study Hours */}
            {currentStep === 3 && (
              <RadioGroup
                value={formData.dailyStudyHours}
                onValueChange={(value) => setFormData({ ...formData, dailyStudyHours: value })}
                className="grid grid-cols-2 gap-3"
              >
                {studyHoursOptions.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`hours-${option.value}`}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-lg border-2 cursor-pointer transition-all text-center",
                      formData.dailyStudyHours === option.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={`hours-${option.value}`} className="sr-only" />
                    <Clock className={cn(
                      "w-8 h-8 mb-2",
                      formData.dailyStudyHours === option.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="font-semibold text-lg">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {/* Step 4: Start Date */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                    <Calendar className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="text-lg py-6"
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Based on your preferences, we&apos;ll create a personalized 180-day study roadmap
                    covering all subjects for{" "}
                    <span className="font-semibold text-foreground">
                      {exams.find((e) => e.id === formData.examTarget)?.name || "your exam"}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              {currentStep < 4 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || !canProceed()}>
                  {loading ? "Setting up..." : "Start Your Journey"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
