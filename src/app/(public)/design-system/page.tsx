import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState, Spinner } from "@/components/ui/loading";
import { SkeletonCard, SkeletonStatCard } from "@/components/ui/skeletons";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PageHeader } from "@/components/ui/page-header";
import { FormField } from "@/components/ui/form-field";
import { FundingProgress } from "@/components/ui/funding-progress";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Sprout, TrendingUp, Wallet, Users, AlertTriangle, Info, CheckCircle, Plus, Inbox,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Design System" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            <Sprout className="size-3.5" />
            Design System
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Biniyog Club UI</h1>
          <p className="text-muted-foreground">
            AgriTech + FinTech design system — component reference
          </p>
        </div>

        {/* Color Palette */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand (Forest Green)</p>
              <div className="flex gap-1">
                {[50,100,200,300,400,500,600,700,800,900].map(w => (
                  <div key={w} className={`h-8 flex-1 rounded bg-brand-${w}`} title={`brand-${w}`} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Finance (Slate Blue)</p>
              <div className="flex gap-1">
                {[50,100,500,600,700].map(w => (
                  <div key={w} className={`h-8 flex-1 rounded bg-finance-${w}`} title={`finance-${w}`} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Harvest (Amber Gold)</p>
              <div className="flex gap-1">
                {[50,100,400,500,600].map(w => (
                  <div key={w} className={`h-8 flex-1 rounded bg-harvest-${w}`} title={`harvest-${w}`} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Separator />

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">Heading 1 — Bold 4xl</h1>
            <h2 className="text-3xl font-semibold tracking-tight">Heading 2 — Semibold 3xl</h2>
            <h3 className="text-2xl font-semibold tracking-tight">Heading 3 — Semibold 2xl</h3>
            <h4 className="text-xl font-semibold">Heading 4 — Semibold xl</h4>
            <p className="text-base leading-7">Body text — base size, leading-7. Used for descriptions and content paragraphs across the platform.</p>
            <p className="text-sm text-muted-foreground">Small muted — used for secondary information, hints, and captions.</p>
            <p className="text-xs text-muted-foreground">Caption — extra small, used for timestamps and metadata.</p>
          </div>
        </Section>

        <Separator />

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm"><Plus className="size-3.5" />Small</Button>
            <Button><Plus className="size-4" />Default</Button>
            <Button size="lg"><Plus className="size-4" />Large</Button>
            <Button size="icon"><Plus /></Button>
            <Button disabled>Disabled</Button>
            <Button><Spinner size="xs" className="mr-1.5" />Loading</Button>
          </div>
        </Section>

        <Separator />

        {/* Badges */}
        <Section title="Badges & Status">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="active">Active</StatusBadge>
            <StatusBadge status="funding">Funding</StatusBadge>
            <StatusBadge status="pending">Pending</StatusBadge>
            <StatusBadge status="approved">Approved</StatusBadge>
            <StatusBadge status="completed">Completed</StatusBadge>
            <StatusBadge status="rejected">Rejected</StatusBadge>
            <StatusBadge status="cancelled">Cancelled</StatusBadge>
            <StatusBadge status="draft">Draft</StatusBadge>
            <StatusBadge status="review">Under Review</StatusBadge>
            <StatusBadge status="matured">Matured</StatusBadge>
          </div>
        </Section>

        <Separator />

        {/* Form Controls */}
        <Section title="Form Controls">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Email address" htmlFor="email" required hint="We'll never share your email.">
              <Input id="email" type="email" placeholder="you@example.com" />
            </FormField>
            <FormField label="Investment amount" htmlFor="amount" error="Amount must be at least ৳10,000">
              <Input id="amount" type="number" placeholder="10000" aria-invalid />
            </FormField>
            <FormField label="Description" htmlFor="desc">
              <Textarea id="desc" placeholder="Describe your project..." rows={3} />
            </FormField>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="terms" />
                <label htmlFor="terms" className="text-sm">I agree to the terms</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="notifications" />
                <label htmlFor="notifications" className="text-sm">Email notifications</label>
              </div>
            </div>
          </div>
        </Section>

        <Separator />

        {/* Cards */}
        <Section title="Cards">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Card</CardTitle>
                <CardDescription>Boro Rice Season 2025 — Bhola District</CardDescription>
              </CardHeader>
              <CardContent>
                <FundingProgress funded={320000} goal={800000} />
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">৳3,20,000 raised</span>
                  <StatusBadge status="funding">Funding</StatusBadge>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="w-full">View Project</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
                <CardDescription>Your active portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total invested</span>
                  <span className="font-semibold">৳1,50,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected return</span>
                  <span className="font-semibold text-success">+৳27,000</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total value</span>
                  <span>৳1,77,000</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Separator />

        {/* Stat Cards */}
        <Section title="Stat Cards">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Invested" value="৳4,50,000" trend={{ value: 12.5 }} description="vs last month" icon={<Wallet className="size-5" />} variant="brand" />
            <StatCard title="Active Projects" value="3" description="2 in funding" icon={<Sprout className="size-5" />} variant="default" />
            <StatCard title="Expected Returns" value="৳81,000" trend={{ value: 18 }} icon={<TrendingUp className="size-5" />} variant="harvest" />
            <StatCard title="Total Investors" value="1,240" trend={{ value: -2.1 }} icon={<Users className="size-5" />} variant="finance" />
          </div>
        </Section>

        <Separator />

        {/* Alerts */}
        <Section title="Alerts">
          <div className="space-y-3">
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>Your KYC verification is pending review. This usually takes 1–2 business days.</AlertDescription>
            </Alert>
            <Alert className="border-success/30 bg-success-muted text-success [&>svg]:text-success">
              <CheckCircle className="size-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription className="text-success/80">Your investment of ৳50,000 has been confirmed successfully.</AlertDescription>
            </Alert>
            <Alert className="border-warning/30 bg-warning-muted [&>svg]:text-warning">
              <AlertTriangle className="size-4 text-warning" />
              <AlertTitle className="text-warning-foreground">Warning</AlertTitle>
              <AlertDescription className="text-warning-foreground/80">This project&apos;s funding deadline is in 3 days.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Payment failed. Please check your account balance and try again.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Separator />

        {/* Tabs */}
        <Section title="Tabs">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="investments">Investments</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <p className="text-sm text-muted-foreground">Project overview content goes here.</p>
            </TabsContent>
            <TabsContent value="investments" className="mt-4">
              <p className="text-sm text-muted-foreground">Investment list goes here.</p>
            </TabsContent>
          </Tabs>
        </Section>

        <Separator />

        {/* Breadcrumb */}
        <Section title="Breadcrumb">
          <Breadcrumb items={[{ label: "Investor Portal" }, { label: "Projects" }, { label: "Boro Rice 2025" }]} />
        </Section>

        <Separator />

        {/* Avatars */}
        <Section title="Avatars">
          <div className="flex items-center gap-3">
            <UserAvatar name="Rahim Uddin" size="xs" />
            <UserAvatar name="Karim Hossain" size="sm" />
            <UserAvatar name="Nasrin Akter" size="md" />
            <UserAvatar name="Platform Admin" size="lg" />
            <UserAvatar name="Super Admin" size="xl" />
          </div>
        </Section>

        <Separator />

        {/* Funding Progress */}
        <Section title="Funding Progress">
          <div className="max-w-sm space-y-4">
            <FundingProgress funded={320000} goal={800000} />
            <FundingProgress funded={800000} goal={800000} />
            <FundingProgress funded={50000} goal={800000} size="sm" showLabels={false} />
          </div>
        </Section>

        <Separator />

        {/* States */}
        <Section title="States">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <EmptyState
                  icon={<Inbox className="size-5" />}
                  title="No investments yet"
                  description="Start investing in agricultural projects."
                  action={<Button size="sm"><Plus className="size-3.5" />Browse Projects</Button>}
                  size="sm"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <ErrorState variant="network" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <LoadingState message="Fetching projects..." />
              </CardContent>
            </Card>
          </div>
        </Section>

        <Separator />

        {/* Skeletons */}
        <Section title="Skeletons">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </Section>

        {/* Page Header */}
        <Separator />
        <Section title="Page Header">
          <div className="rounded-xl border bg-muted/30 p-4">
            <PageHeader
              title="My Investments"
              description="Track and manage your agricultural investment portfolio."
              breadcrumb={<Breadcrumb items={[{ label: "Investor Portal" }, { label: "Investments" }]} />}
              action={<Button><Plus className="size-4" />New Investment</Button>}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
