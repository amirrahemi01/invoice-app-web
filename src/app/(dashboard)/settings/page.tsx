import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your business and invoice settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Information</CardTitle>
          <CardDescription>This information will appear on your invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input id="business-name" placeholder="Your Business Name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contact@business.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Enter your business address" rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Defaults</CardTitle>
          <CardDescription>Default settings for new invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input id="tax-rate" type="number" step="0.1" min="0" placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-terms">Payment Terms (days)</Label>
              <Input id="payment-terms" type="number" min="0" placeholder="30" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
            <Input id="invoice-prefix" placeholder="INV-" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-notes">Default Notes</Label>
            <Textarea id="default-notes" placeholder="Notes to include on all invoices..." rows={3} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
