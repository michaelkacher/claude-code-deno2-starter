import { useState } from "preact/hooks";
import { Avatar } from "../../components/design-system/Avatar.tsx";
import { Badge } from "../../components/design-system/Badge.tsx";
import { Button } from "../../components/design-system/Button.tsx";
import { Card } from "../../components/design-system/Card.tsx";
import { Panel } from "../../components/design-system/Panel.tsx";

interface MockTask {
  id: string;
  title: string;
  originalRequirements: string;
  aiGeneratedRequirements: string;
  aiGeneratedTests: string;
  status: "pending_review" | "approved" | "rejected";
  priority: "critical" | "high" | "medium" | "low";
  assignedReviewer: string;
  submittedBy: string;
  submittedAt: string;
}

export default function ApprovalGate() {
  const [selectedTab, setSelectedTab] = useState<"requirements" | "tests">("requirements");
  const [feedback, setFeedback] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState<"approve" | "reject" | null>(null);

  // Mock data for the approval gate
  const mockTask: MockTask = {
    id: "TASK-2024-001",
    title: "User Authentication System with JWT",
    originalRequirements: `Create a secure user authentication system that supports:

1. User registration with email validation
2. Login with email/password
3. JWT token-based session management
4. Password reset functionality
5. Rate limiting for security

Success Criteria:
- Registration completion rate > 95%
- Login response time < 200ms
- Zero security vulnerabilities in security audit
- Support for 1000+ concurrent users`,
    aiGeneratedRequirements: `I will implement a comprehensive user authentication system with the following components:

**Core Features:**
1. **User Registration Flow**
   - Email validation with verification tokens
   - Password strength requirements (min 8 chars, uppercase, lowercase, number, special char)
   - Duplicate email prevention
   - Welcome email automation

2. **Login System**
   - Email/password authentication
   - JWT token generation (24h expiry)
   - Refresh token mechanism
   - Remember me functionality

3. **Security Layer**
   - Rate limiting: 5 attempts per 15 minutes
   - Password hashing with PBKDF2 (100,000 iterations)
   - CSRF protection
   - Input sanitization and validation

4. **Password Reset**
   - Secure token generation (6-hour expiry)
   - Email delivery system
   - Password update with validation

**Technical Implementation:**
- Database: User table with encrypted passwords
- API Endpoints: /auth/register, /auth/login, /auth/refresh, /auth/reset
- Middleware: JWT validation, rate limiting
- Frontend: React forms with real-time validation

**Performance Targets:**
- Login endpoint: < 150ms average response
- Registration: < 300ms including email send
- Database queries optimized with indexes
- Caching for rate limit counters`,
    aiGeneratedTests: `**Test Suite for User Authentication System**

**Unit Tests (25 tests):**

1. **Registration Tests (8 tests)**
   - ✓ Valid registration creates user
   - ✓ Duplicate email rejection
   - ✓ Password strength validation
   - ✓ Email format validation
   - ✓ Verification token generation
   - ✓ Welcome email sending
   - ✓ Database constraint handling
   - ✓ Input sanitization

2. **Login Tests (7 tests)**
   - ✓ Valid credentials return JWT
   - ✓ Invalid password rejection
   - ✓ Non-existent user handling
   - ✓ Token expiry validation
   - ✓ Refresh token functionality
   - ✓ Rate limiting enforcement
   - ✓ Remember me persistence

3. **Security Tests (6 tests)**
   - ✓ Password hashing verification
   - ✓ JWT token validation
   - ✓ CSRF protection
   - ✓ SQL injection prevention
   - ✓ XSS attack prevention
   - ✓ Rate limit bypass attempts

4. **Password Reset Tests (4 tests)**
   - ✓ Reset token generation
   - ✓ Token expiry handling
   - ✓ Email delivery confirmation
   - ✓ Password update validation

**Integration Tests (10 tests):**
- End-to-end registration flow
- Complete login/logout cycle
- Password reset workflow
- Rate limiting across endpoints
- Database transaction integrity
- Email service integration
- Frontend-backend communication
- Error handling and user feedback
- Performance under load
- Security audit compliance

**Performance Tests (5 tests):**
- Login response time < 200ms
- Registration under load
- Concurrent user simulation
- Database query optimization
- Memory usage validation`,
    status: "pending_review",
    priority: "high",
    assignedReviewer: "Sarah Chen (Tech Lead)",
    submittedBy: "AI Agent Alpha-2",
    submittedAt: "2024-11-12T10:30:00Z"
  };

  const approvalHistory = [
    { action: "Submitted for Review", user: "AI Agent Alpha-2", timestamp: "2024-11-12T10:30:00Z", note: "Initial generation complete" },
    { action: "Assigned Reviewer", user: "System", timestamp: "2024-11-12T10:31:00Z", note: "Assigned to Sarah Chen based on expertise" },
    { action: "Review Started", user: "Sarah Chen", timestamp: "2024-11-12T14:15:00Z", note: "Beginning technical review" }
  ];

  const handleApproval = (action: "approve" | "reject") => {
    setShowFeedbackForm(action);
  };

  const submitDecision = () => {
    console.log(`${showFeedbackForm?.toUpperCase()}: ${feedback}`);
    setShowFeedbackForm(null);
    setFeedback("");
    // In real implementation, this would update the task status
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div class="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Human Approval Gate</h1>
            <p class="text-gray-600 mt-1">Review AI-generated requirements and test specifications</p>
          </div>
          <div class="flex items-center space-x-4">
            <Badge variant="outline" class={`${getPriorityColor(mockTask.priority)} text-white`}>
              {mockTask.priority.toUpperCase()} PRIORITY
            </Badge>
            <Badge variant="outline" class="bg-blue-500 text-white">
              {mockTask.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Task Info Card */}
      <Card class="mb-6 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{mockTask.title}</h2>
            <p class="text-gray-600">Task ID: {mockTask.id}</p>
          </div>
          <div class="text-right text-sm text-gray-600">
            <p>Assigned to: <span class="font-medium">{mockTask.assignedReviewer}</span></p>
            <p>Submitted by: <span class="font-medium">{mockTask.submittedBy}</span></p>
            <p>Submitted: {new Date(mockTask.submittedAt).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Review Tabs */}
      <div class="flex space-x-1 mb-6">
        <button
          onClick={() => setSelectedTab("requirements")}
          class={`px-4 py-2 rounded-lg font-medium ${
            selectedTab === "requirements"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Requirements Review
        </button>
        <button
          onClick={() => setSelectedTab("tests")}
          class={`px-4 py-2 rounded-lg font-medium ${
            selectedTab === "tests"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Test Logic Review
        </button>
      </div>

      {/* Main Review Content */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Original Requirements */}
        <Panel title="Original Requirements" class="h-fit">
          <div class="prose prose-sm max-w-none">
            <pre class="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
              {mockTask.originalRequirements}
            </pre>
          </div>
        </Panel>

        {/* AI Generated Content */}
        <Panel 
          title={selectedTab === "requirements" ? "AI-Generated Requirements" : "AI-Generated Test Strategy"}
          class="h-fit"
        >
          <div class="prose prose-sm max-w-none">
            <pre class="whitespace-pre-wrap text-sm text-gray-700 bg-blue-50 p-4 rounded border-l-4 border-blue-500">
              {selectedTab === "requirements" ? mockTask.aiGeneratedRequirements : mockTask.aiGeneratedTests}
            </pre>
          </div>
        </Panel>
      </div>

      {/* Approval Actions */}
      {!showFeedbackForm && (
        <Card class="p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">Review Decision</h3>
          <div class="flex space-x-4">
            <Button 
              onClick={() => handleApproval("approve")}
              class="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
            >
              ✓ Approve & Continue
            </Button>
            <Button 
              onClick={() => handleApproval("reject")}
              class="bg-red-500 hover:bg-red-600 text-white px-6 py-2"
            >
              ✗ Reject & Request Changes
            </Button>
            <Button 
              variant="outline"
              class="px-6 py-2"
            >
              💬 Request Clarification
            </Button>
          </div>
        </Card>
      )}

      {/* Feedback Form */}
      {showFeedbackForm && (
        <Card class="p-6 mb-6 border-2 border-blue-500">
          <h3 class="text-lg font-semibold mb-4">
            {showFeedbackForm === "approve" ? "Approval Confirmation" : "Rejection Feedback"}
          </h3>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {showFeedbackForm === "approve" 
                ? "Any final notes or conditions?" 
                : "What needs to be changed? (Required)"}
            </label>
            <textarea
              value={feedback}
              onInput={(e) => setFeedback((e.target as HTMLTextAreaElement).value)}
              class="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={showFeedbackForm === "approve" 
                ? "Optional: Add any implementation notes or conditions..."
                : "Please specify what needs to be changed and why..."}
            />
          </div>
          <div class="flex space-x-4">
            <Button 
              onClick={submitDecision}
              class={`${showFeedbackForm === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white px-6 py-2`}
            >
              Confirm {showFeedbackForm === "approve" ? "Approval" : "Rejection"}
            </Button>
            <Button 
              onClick={() => setShowFeedbackForm(null)}
              variant="outline"
              class="px-6 py-2"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Approval History */}
      <Panel title="Approval History & Audit Trail" class="mb-6">
        <div class="space-y-4">
          {approvalHistory.map((entry, index) => (
            <div key={index} class="flex items-start space-x-3 p-3 bg-gray-50 rounded">
              <Avatar name={entry.user} size="sm" />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900">{entry.action}</span>
                  <Badge variant="outline" class="text-xs">
                    {entry.user}
                  </Badge>
                </div>
                <p class="text-sm text-gray-600">{entry.note}</p>
                <p class="text-xs text-gray-500 mt-1">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Quick Stats */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card class="p-4 text-center">
          <div class="text-2xl font-bold text-green-500">94.2%</div>
          <div class="text-sm text-gray-600">Approval Rate</div>
        </Card>
        <Card class="p-4 text-center">
          <div class="text-2xl font-bold text-blue-500">18m</div>
          <div class="text-sm text-gray-600">Avg Review Time</div>
        </Card>
        <Card class="p-4 text-center">
          <div class="text-2xl font-bold text-orange-500">3</div>
          <div class="text-sm text-gray-600">Pending Reviews</div>
        </Card>
        <Card class="p-4 text-center">
          <div class="text-2xl font-bold text-purple-500">127</div>
          <div class="text-sm text-gray-600">Tasks This Week</div>
        </Card>
      </div>
    </div>
  );
}
