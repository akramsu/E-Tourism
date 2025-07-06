"use client"

import { AlertManagement } from "@/components/alerts/alert-management"

export function AlertConfiguration() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alert Configuration</h1>
          <p className="text-muted-foreground">
            Configure database-triggered alerts and notification settings for tourism monitoring
          </p>
        </div>
      </div>

      <AlertManagement />
    </div>
  )
}
