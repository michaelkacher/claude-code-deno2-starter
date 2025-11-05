/**
 * Design System Showcase Island
 * Interactive demonstration of all design system components
 */

import { useSignal } from '@preact/signals';
import {
    Avatar,
    AvatarGroup,
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Grid,
    Input,
    Modal,
    PageHeader,
    PageLayout,
    Panel,
    ProgressBar,
    Select,
    Spinner,
    Stack,
    Steps
} from '../components/design-system/index.ts';

export default function DesignSystemShowcase() {
  const showModal = useSignal(false);
  const showPanel = useSignal(false);
  const inputValue = useSignal('');
  const selectValue = useSignal('');
  const progressValue = useSignal(65);
  const currentStep = useSignal(1);

  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="Design System"
        subtitle="Comprehensive component library for rapid UI development"
      />

      {/* Buttons */}
      <Card className="mb-8">
        <CardHeader>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Buttons</h2>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Various button styles and sizes</p>
        </CardHeader>
        <CardBody>
          <Stack spacing={4}>
            <div>
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Variants
              </p>
              <div class="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <Divider />

            <div>
              <p class="text-sm font-semibold text-gray-700 mb-3">Sizes</p>
              <div class="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            <Divider />

            <div>
              <p class="text-sm font-semibold text-gray-700 mb-3">States</p>
              <div class="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
                <Button
                  leftIcon={
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                  }
                >
                  With Icon
                </Button>
              </div>
            </div>
          </Stack>
        </CardBody>
      </Card>

      {/* Cards */}
      <Card className="mb-8">
        <CardHeader>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Cards</h2>
          <p class="text-gray-600 mt-1">Container components with variants</p>
        </CardHeader>
        <CardBody>
          <Grid cols={3}>
            <Card variant="default">
              <CardBody>
                <p class="font-semibold mb-1">Default Card</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Standard card with border
                </p>
              </CardBody>
            </Card>

            <Card variant="elevated">
              <CardBody>
                <p class="font-semibold mb-1">Elevated Card</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Card with shadow</p>
              </CardBody>
            </Card>

            <Card variant="gradient">
              <CardBody>
                <p class="font-semibold mb-1">Gradient Card</p>
                <p class="text-sm">Colorful gradient background</p>
              </CardBody>
            </Card>
          </Grid>
        </CardBody>
      </Card>

      {/* Badges */}
      <Card className="mb-8">
        <CardHeader>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Badges</h2>
          <p class="text-gray-600 mt-1">Status indicators and labels</p>
        </CardHeader>
        <CardBody>
          <div class="flex flex-wrap gap-3">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="success" dot>
              With Dot
            </Badge>
            <Badge variant="primary" pill={false}>
              Rounded
            </Badge>
          </div>
        </CardBody>
      </Card>

      {/* Inputs */}
      <Card className="mb-8">
        <CardHeader>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Form Inputs</h2>
          <p class="text-gray-600 mt-1">Text inputs and selects</p>
        </CardHeader>
        <CardBody>
          <Stack spacing={6}>
            <Input
              label="Default Input"
              placeholder="Enter text..."
              value={inputValue.value}
              onChange={(e) =>
                (inputValue.value = (e.target as HTMLInputElement).value)}
              helperText="This is helper text"
              fullWidth
            />

            <Input
              label="Input with Icon"
              placeholder="Search..."
              leftIcon={
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clip-rule="evenodd"
                  />
                </svg>
              }
              fullWidth
            />

            <Input
              label="Error State"
              placeholder="Email address"
              errorText="Please enter a valid email address"
              fullWidth
            />

            <Select
              label="Select Dropdown"
              placeholder="Choose an option..."
              value={selectValue.value}
              onChange={(e) =>
                (selectValue.value = (e.target as HTMLSelectElement).value)}
              options={[
                { value: '1', label: 'Option 1' },
                { value: '2', label: 'Option 2' },
                { value: '3', label: 'Option 3' },
              ]}
              fullWidth
            />
          </Stack>
        </CardBody>
      </Card>

      {/* Avatars */}
      <Card className="mb-8">
        <CardHeader>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Avatars</h2>
          <p class="text-gray-600 mt-1">User profile images</p>
        </CardHeader>
        <CardBody>
          <Stack spacing={6}>
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-3">Sizes</p>
              <div class="flex flex-wrap items-center gap-4">
                <Avatar name="John Doe" size="xs" />
                <Avatar name="John Doe" size="sm" />
                <Avatar name="John Doe" size="md" />
                <Avatar name="John Doe" size="lg" />
                <Avatar name="John Doe" size="xl" />
                <Avatar name="John Doe" size="2xl" />
              </div>
            </div>

            <Divider />

            <div>
              <p class="text-sm font-semibold text-gray-700 mb-3">
                With Status
              </p>
              <div class="flex flex-wrap items-center gap-4">
                <Avatar name="Alice" status="online" />
                <Avatar name="Bob" status="offline" />
                <Avatar name="Charlie" status="away" />
                <Avatar name="Diana" status="busy" />
              </div>
            </div>

            <Divider />

            <div>
              <p class="text-sm font-semibold text-gray-700 mb-3">
                Avatar Group
              </p>
              <AvatarGroup
                avatars={[
                  { name: 'Alice Smith' },
                  { name: 'Bob Johnson' },
                  { name: 'Charlie Brown' },
                  { name: 'Diana Prince' },
                  { name: 'Eve Adams' },
                  { name: 'Frank Miller' },
                ]}
                max={4}
              />
            </div>
          </Stack>
        </CardBody>
      </Card>

      {/* Progress */}
      <Card className="mb-8">
        <CardHeader>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Progress Indicators</h2>
          <p class="text-gray-600 mt-1">Loading states and progress bars</p>
        </CardHeader>
        <CardBody>
          <Stack spacing={6}>
            <div>
              <p class="text-sm font-semibold text-gray-700 mb-3">
                Progress Bars
              </p>
              <Stack spacing={4}>
                <ProgressBar
                  value={progressValue.value}
                  label="Upload Progress"
                  showLabel
                />
                <ProgressBar
                  value={45}
                  variant="success"
                  label="Success"
                  showLabel
                />
                <ProgressBar
                  value={75}
                  variant="warning"
                  label="Warning"
                  showLabel
                />
                <ProgressBar
                  value={30}
                  variant="danger"
                  label="Danger"
                  showLabel
                />
              </Stack>
            </div>

            <Divider />

            <div>
              <p class="text-sm font-semibold text-gray-700 mb-3">Spinners</p>
              <div class="flex flex-wrap items-center gap-4">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
                <Spinner size="xl" />
              </div>
            </div>

            <Divider />

            <div>
              <p class="text-sm font-semibold text-gray-700 mb-3">Steps</p>
              <Steps
                steps={[
                  { label: 'Select', description: 'Choose option' },
                  { label: 'Configure', description: 'Set parameters' },
                  { label: 'Review', description: 'Confirm details' },
                  { label: 'Complete', description: 'Finish setup' },
                ]}
                currentStep={currentStep.value}
              />
              <div class="flex justify-center gap-3 mt-6">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentStep.value === 0}
                  onClick={() =>
                    (currentStep.value = Math.max(0, currentStep.value - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  disabled={currentStep.value === 3}
                  onClick={() =>
                    (currentStep.value = Math.min(3, currentStep.value + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </Stack>
        </CardBody>
      </Card>

      {/* Modal & Panel */}
      <Card className="mb-8">
        <CardHeader>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Overlays</h2>
          <p class="text-gray-600 mt-1">Modals and side panels</p>
        </CardHeader>
        <CardBody>
          <div class="flex gap-4">
            <Button onClick={() => (showModal.value = true)}>
              Open Modal
            </Button>
            <Button
              variant="secondary"
              onClick={() => (showPanel.value = true)}
            >
              Open Panel
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal.value}
        onClose={() => (showModal.value = false)}
        title="Example Modal"
        size="md"
      >
        <Stack spacing={4}>
          <p class="text-gray-700 dark:text-gray-300">
            This is an example modal dialog. You can put any content here.
          </p>
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email..."
            fullWidth
          />
          <div class="flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => (showModal.value = false)}
            >
              Cancel
            </Button>
            <Button onClick={() => (showModal.value = false)}>
              Confirm
            </Button>
          </div>
        </Stack>
      </Modal>

      {/* Panel */}
      <Panel
        isOpen={showPanel.value}
        onClose={() => (showPanel.value = false)}
        title="Side Panel"
        position="right"
        size="md"
      >
        <Stack spacing={4}>
          <p class="text-gray-700 dark:text-gray-300">
            This is a side panel that slides in from the side of the screen.
          </p>

          <Card variant="elevated" padding="md">
            <p class="font-semibold mb-2">Panel Content</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              You can place any components inside the panel.
            </p>
          </Card>

          <Input
            label="Search"
            placeholder="Search..."
            leftIcon={
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd"
                />
              </svg>
            }
            fullWidth
          />

          <div class="flex gap-3 mt-6">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => (showPanel.value = false)}
            >
              Close
            </Button>
            <Button fullWidth>Apply</Button>
          </div>
        </Stack>
      </Panel>

      {/* Footer */}
      <Card variant="gradient" className="text-center">
        <h3 class="text-2xl font-bold mb-2">Ready to Build?</h3>
        <p class="mb-6">
          Use these components to quickly create beautiful mockups and
          applications.
        </p>
        <Button variant="secondary">Get Started</Button>
      </Card>
    </PageLayout>
  );
}
