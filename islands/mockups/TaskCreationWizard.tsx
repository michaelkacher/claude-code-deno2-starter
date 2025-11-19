import { Avatar } from "@/components/design-system/Avatar.tsx";
import { Badge } from "@/components/design-system/Badge.tsx";
import { Button } from "@/components/design-system/Button.tsx";
import { Card } from "@/components/design-system/Card.tsx";
import { Input } from "@/components/design-system/Input.tsx";
import { Panel } from "@/components/design-system/Panel.tsx";
import { useState } from "preact/hooks";

interface TaskFormData {
  title: string;
  description: string;
  successCriteria: string[];
  priority: "critical" | "high" | "medium" | "low";
  category: "frontend" | "backend" | "api" | "database" | "integration" | "testing";
  aiAgent: string;
  reviewers: string[];
  dependencies: string[];
  estimatedComplexity: "simple" | "medium" | "complex";
  tags: string[];
}

interface Reviewer {
  id: string;
  name: string;
  role: string;
  expertise: string[];
  workload: number;
  avatar: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  successCriteria: string[];
  aiInstructions: string;
}

export default function TaskCreationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    successCriteria: [""],
    priority: "medium",
    category: "backend",
    aiAgent: "",
    reviewers: [],
    dependencies: [],
    estimatedComplexity: "medium",
    tags: []
  });
  const [newCriterion, setNewCriterion] = useState("");
  const [newTag, setNewTag] = useState("");

  const mockReviewers: Reviewer[] = [
    {
      id: "sarah",
      name: "Sarah Chen",
      role: "Tech Lead",
      expertise: ["backend", "api", "database", "security"],
      workload: 75,
      avatar: "SC"
    },
    {
      id: "mike",
      name: "Mike Johnson",
      role: "Backend Engineer",
      expertise: ["backend", "database", "integration"],
      workload: 60,
      avatar: "MJ"
    },
    {
      id: "alex",
      name: "Alex Rodriguez",
      role: "Frontend Engineer",
      expertise: ["frontend", "ui", "testing"],
      workload: 40,
      avatar: "AR"
    },
    {
      id: "emma",
      name: "Emma Wilson",
      role: "QA Engineer",
      expertise: ["testing", "automation", "quality"],
      workload: 85,
      avatar: "EW"
    }
  ];

  const mockTemplates: Template[] = [
    {
      id: "auth",
      name: "Authentication System",
      description: "Complete user authentication with JWT",
      category: "backend",
      successCriteria: [
        "Registration completion rate > 95%",
        "Login response time < 200ms",
        "Zero security vulnerabilities",
        "Support 1000+ concurrent users"
      ],
      aiInstructions: "Create secure authentication with email validation, JWT tokens, password reset, and rate limiting"
    },
    {
      id: "api",
      name: "REST API Endpoint",
      description: "Standard CRUD API with validation",
      category: "api", 
      successCriteria: [
        "Response time < 100ms",
        "Input validation on all fields",
        "Proper error handling",
        "Complete OpenAPI documentation"
      ],
      aiInstructions: "Build REST API with proper validation, error handling, documentation, and comprehensive tests"
    },
    {
      id: "dashboard",
      name: "Analytics Dashboard",
      description: "Data visualization dashboard",
      category: "frontend",
      successCriteria: [
        "Load time < 2 seconds",
        "Real-time data updates",
        "Mobile responsive design",
        "Accessibility compliance"
      ],
      aiInstructions: "Create responsive dashboard with charts, real-time updates, and accessibility features"
    }
  ];

  const aiAgents = [
    { id: "alpha-1", name: "Alpha-1", specialty: "Backend & APIs", availability: "Available" },
    { id: "alpha-2", name: "Alpha-2", specialty: "Security & Auth", availability: "Busy (2h queue)" },
    { id: "beta-1", name: "Beta-1", specialty: "Frontend & UI", availability: "Available" },
    { id: "gamma-1", name: "Gamma-1", specialty: "Database & Integration", availability: "Available" }
  ];

  const steps = [
    { number: 1, title: "Requirements", description: "Define task requirements and success criteria" },
    { number: 2, title: "AI Configuration", description: "Configure AI processing parameters" },
    { number: 3, title: "Reviewers", description: "Assign human reviewers" },
    { number: 4, title: "Dependencies", description: "Set dependencies and priority" },
    { number: 5, title: "Review", description: "Review and submit task" }
  ];

  const addSuccessCriterion = () => {
    if (newCriterion.trim()) {
      setFormData({
        ...formData,
        successCriteria: [...formData.successCriteria, newCriterion.trim()]
      });
      setNewCriterion("");
    }
  };

  const removeSuccessCriterion = (index: number) => {
    setFormData({
      ...formData,
      successCriteria: formData.successCriteria.filter((_, i) => i !== index)
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const toggleReviewer = (reviewerId: string) => {
    setFormData({
      ...formData,
      reviewers: formData.reviewers.includes(reviewerId)
        ? formData.reviewers.filter(id => id !== reviewerId)
        : [...formData.reviewers, reviewerId]
    });
  };

  const applyTemplate = (template: Template) => {
    setFormData({
      ...formData,
      title: template.name,
      description: template.description,
      successCriteria: template.successCriteria,
      category: template.category as any
    });
  };

  const getRecommendedReviewers = () => {
    return mockReviewers.filter(reviewer => 
      reviewer.expertise.includes(formData.category)
    ).sort((a, b) => a.workload - b.workload);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div class="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Create New AI Task</h1>
        <p class="text-gray-600 mt-1">Define requirements for AI-powered feature development</p>
      </div>

      {/* Progress Bar */}
      <div class="mb-8">
        <div class="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} class="flex items-center">
              <div class={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.number
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {currentStep > step.number ? "✓" : step.number}
              </div>
              <div class="ml-3 hidden md:block">
                <div class="text-sm font-medium text-gray-900">{step.title}</div>
                <div class="text-xs text-gray-600">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div class={`mx-4 flex-1 h-1 ${
                  currentStep > step.number ? "bg-blue-500" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div class="lg:col-span-2">
          <Card class="p-6">
            {/* Step 1: Requirements */}
            {currentStep === 1 && (
              <div class="space-y-6">
                <h2 class="text-xl font-semibold">Task Requirements</h2>

                {/* Template Selection */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Quick Start with Template (Optional)
                  </label>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {mockTemplates.map(template => (
                      <div 
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        class="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50"
                      >
                        <h3 class="font-medium text-sm">{template.name}</h3>
                        <p class="text-xs text-gray-600 mt-1">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                  <Input
                    value={formData.title}
                    onInput={(e) => setFormData({...formData, title: (e.target as HTMLInputElement).value})}
                    placeholder="e.g., User Authentication System"
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onInput={(e) => setFormData({...formData, description: (e.target as HTMLTextAreaElement).value})}
                    placeholder="Detailed description of what needs to be built..."
                    class="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Success Criteria *</label>
                  <div class="space-y-2">
                    {formData.successCriteria.filter(c => c.trim()).map((criterion, index) => (
                      <div key={index} class="flex items-center space-x-2">
                        <span class="text-sm bg-green-100 text-green-800 px-3 py-1 rounded flex-1">
                          {criterion}
                        </span>
                        <button
                          onClick={() => removeSuccessCriterion(index)}
                          class="text-red-500 hover:text-red-700 px-2 py-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div class="flex space-x-2">
                      <Input
                        value={newCriterion}
                        onInput={(e) => setNewCriterion((e.target as HTMLInputElement).value)}
                        placeholder="e.g., Login response time < 200ms"
                        class="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && addSuccessCriterion()}
                      />
                      <Button onClick={addSuccessCriterion} size="sm">Add</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: AI Configuration */}
            {currentStep === 2 && (
              <div class="space-y-6">
                <h2 class="text-xl font-semibold">AI Configuration</h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: (e.target as HTMLSelectElement).value as any})}
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="backend">Backend</option>
                      <option value="frontend">Frontend</option>
                      <option value="api">API</option>
                      <option value="database">Database</option>
                      <option value="integration">Integration</option>
                      <option value="testing">Testing</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Estimated Complexity</label>
                    <select
                      value={formData.estimatedComplexity}
                      onChange={(e) => setFormData({...formData, estimatedComplexity: (e.target as HTMLSelectElement).value as any})}
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="simple">Simple (1-2 days)</option>
                      <option value="medium">Medium (3-5 days)</option>
                      <option value="complex">Complex (1+ weeks)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">AI Agent Assignment *</label>
                  <div class="space-y-2">
                    {aiAgents.map(agent => (
                      <label key={agent.id} class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="aiAgent"
                          value={agent.id}
                          checked={formData.aiAgent === agent.id}
                          onChange={(e) => setFormData({...formData, aiAgent: (e.target as HTMLInputElement).value})}
                          class="mr-3"
                        />
                        <div class="flex-1">
                          <div class="font-medium">{agent.name}</div>
                          <div class="text-sm text-gray-600">{agent.specialty}</div>
                        </div>
                        <Badge variant="outline" class={agent.availability.includes("Available") ? "text-green-600" : "text-orange-600"}>
                          {agent.availability}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div class="space-y-2">
                    <div class="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="outline" class="flex items-center space-x-1">
                          <span>{tag}</span>
                          <button onClick={() => removeTag(tag)} class="text-red-500 hover:text-red-700">✕</button>
                        </Badge>
                      ))}
                    </div>
                    <div class="flex space-x-2">
                      <Input
                        value={newTag}
                        onInput={(e) => setNewTag((e.target as HTMLInputElement).value)}
                        placeholder="Add tag..."
                        class="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button onClick={addTag} size="sm">Add Tag</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Reviewers */}
            {currentStep === 3 && (
              <div class="space-y-6">
                <h2 class="text-xl font-semibold">Assign Human Reviewers</h2>

                <div>
                  <h3 class="font-medium text-gray-700 mb-3">Recommended Reviewers (based on expertise)</h3>
                  <div class="space-y-2">
                    {getRecommendedReviewers().map(reviewer => (
                      <label key={reviewer.id} class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.reviewers.includes(reviewer.id)}
                          onChange={() => toggleReviewer(reviewer.id)}
                          class="mr-3"
                        />
                        <Avatar name={reviewer.name} size="sm" class="mr-3" />
                        <div class="flex-1">
                          <div class="font-medium">{reviewer.name}</div>
                          <div class="text-sm text-gray-600">{reviewer.role}</div>
                          <div class="flex flex-wrap gap-1 mt-1">
                            {reviewer.expertise.map(skill => (
                              <Badge key={skill} variant="outline" class="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-sm text-gray-600">Workload: {reviewer.workload}%</div>
                          <div class={`text-xs ${reviewer.workload > 80 ? 'text-red-600' : reviewer.workload > 60 ? 'text-orange-600' : 'text-green-600'}`}>
                            {reviewer.workload > 80 ? 'High Load' : reviewer.workload > 60 ? 'Medium Load' : 'Available'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 class="font-medium text-gray-700 mb-3">All Team Members</h3>
                  <div class="space-y-2">
                    {mockReviewers.filter(r => !getRecommendedReviewers().includes(r)).map(reviewer => (
                      <label key={reviewer.id} class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 opacity-75">
                        <input
                          type="checkbox"
                          checked={formData.reviewers.includes(reviewer.id)}
                          onChange={() => toggleReviewer(reviewer.id)}
                          class="mr-3"
                        />
                        <Avatar name={reviewer.name} size="sm" class="mr-3" />
                        <div class="flex-1">
                          <div class="font-medium">{reviewer.name}</div>
                          <div class="text-sm text-gray-600">{reviewer.role}</div>
                        </div>
                        <div class="text-right">
                          <div class="text-sm text-gray-600">Workload: {reviewer.workload}%</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Dependencies */}
            {currentStep === 4 && (
              <div class="space-y-6">
                <h2 class="text-xl font-semibold">Dependencies & Priority</h2>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Priority Level *</label>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(["critical", "high", "medium", "low"] as const).map(priority => (
                      <label key={priority} class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={formData.priority === priority}
                          onChange={(e) => setFormData({...formData, priority: (e.target as HTMLInputElement).value as any})}
                          class="mr-2"
                        />
                        <Badge class={getPriorityColor(priority)}>
                          {priority.toUpperCase()}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Dependencies (Optional)</label>
                  <Input
                    placeholder="e.g., TASK-001, TASK-005"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-500 mt-1">Comma-separated list of task IDs that must be completed first</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Additional Instructions for AI</label>
                  <textarea
                    placeholder="Any specific requirements, constraints, or preferences for the AI agent..."
                    class="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div class="space-y-6">
                <h2 class="text-xl font-semibold">Review & Submit</h2>

                <Panel title="Task Summary">
                  <div class="space-y-4">
                    <div>
                      <h3 class="font-medium text-gray-900">{formData.title}</h3>
                      <p class="text-sm text-gray-600 mt-1">{formData.description}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="font-medium">Category:</span> {formData.category}
                      </div>
                      <div>
                        <span class="font-medium">Priority:</span> 
                        <Badge class={`ml-2 ${getPriorityColor(formData.priority)}`}>
                          {formData.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <span class="font-medium">AI Agent:</span> {formData.aiAgent}
                      </div>
                      <div>
                        <span class="font-medium">Complexity:</span> {formData.estimatedComplexity}
                      </div>
                    </div>

                    <div>
                      <span class="font-medium text-sm">Success Criteria:</span>
                      <ul class="mt-1 space-y-1">
                        {formData.successCriteria.filter(c => c.trim()).map((criterion, index) => (
                          <li key={index} class="text-sm text-gray-600">• {criterion}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span class="font-medium text-sm">Assigned Reviewers:</span>
                      <div class="flex flex-wrap gap-2 mt-1">
                        {formData.reviewers.map(reviewerId => {
                          const reviewer = mockReviewers.find(r => r.id === reviewerId);
                          return reviewer ? (
                            <div key={reviewerId} class="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1">
                              <Avatar name={reviewer.name} size="sm" />
                              <span class="text-xs">{reviewer.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {formData.tags.length > 0 && (
                      <div>
                        <span class="font-medium text-sm">Tags:</span>
                        <div class="flex flex-wrap gap-1 mt-1">
                          {formData.tags.map(tag => (
                            <Badge key={tag} variant="outline" class="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              </div>
            )}

            {/* Navigation */}
            <div class="flex justify-between mt-8">
              <Button
                onClick={prevStep}
                variant="outline"
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              <div class="space-x-2">
                {currentStep < steps.length ? (
                  <Button onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button class="bg-green-500 hover:bg-green-600 text-white">
                    Create Task
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div class="space-y-6">
          {/* Tips Panel */}
          <Panel title="💡 Tips for AI Tasks">
            <div class="text-sm text-gray-600 space-y-2">
              <p><strong>Clear Requirements:</strong> Be specific about what you want built</p>
              <p><strong>Success Criteria:</strong> Define measurable outcomes</p>
              <p><strong>Right Reviewers:</strong> Choose experts in the relevant domain</p>
              <p><strong>Dependencies:</strong> Identify what must be done first</p>
            </div>
          </Panel>

          {/* AI Agent Status */}
          <Panel title="🤖 AI Agent Status">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Alpha-1</span>
                <Badge class="bg-green-500 text-white text-xs">Available</Badge>
              </div>
              <div class="flex justify-between">
                <span>Alpha-2</span>
                <Badge class="bg-orange-500 text-white text-xs">Busy</Badge>
              </div>
              <div class="flex justify-between">
                <span>Beta-1</span>
                <Badge class="bg-green-500 text-white text-xs">Available</Badge>
              </div>
              <div class="flex justify-between">
                <span>Gamma-1</span>
                <Badge class="bg-green-500 text-white text-xs">Available</Badge>
              </div>
            </div>
          </Panel>

          {/* Recent Tasks */}
          <Panel title="📋 Recent Tasks">
            <div class="space-y-2 text-sm">
              <div class="p-2 bg-gray-50 rounded">
                <div class="font-medium">Payment Integration</div>
                <Badge class="bg-green-500 text-white text-xs mt-1">Completed</Badge>
              </div>
              <div class="p-2 bg-gray-50 rounded">
                <div class="font-medium">User Profile API</div>
                <Badge class="bg-yellow-500 text-white text-xs mt-1">In Review</Badge>
              </div>
              <div class="p-2 bg-gray-50 rounded">
                <div class="font-medium">Dashboard Charts</div>
                <Badge class="bg-blue-500 text-white text-xs mt-1">Processing</Badge>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
