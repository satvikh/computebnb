"use client";

import { ActivityLogPanel } from "@/src/components/worker/activity-log-panel";
import { ActiveJobCard } from "@/src/components/worker/active-job-card";
import { AppShell } from "@/src/components/worker/app-shell";
import { LatestOutputCard } from "@/src/components/worker/latest-output-card";
import { RecentJobsTable } from "@/src/components/worker/recent-jobs-table";
import { ResourceUsageCard } from "@/src/components/worker/resource-usage-card";
import { useWorker } from "@/src/hooks/use-worker";

export default function ProviderJobsPage() {
  const { state, pauseWorker, resumeWorker } = useWorker();
  return (
    <AppShell title="Current job and output" eyebrow="Producer flow">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <ActiveJobCard job={state.activeJob} workerStatus={state.machine.status} onPause={pauseWorker} onResume={resumeWorker} />
          <LatestOutputCard latestOutput={state.latestOutput} />
          <RecentJobsTable jobs={state.recentJobs} />
        </div>
        <div className="space-y-5">
          <ResourceUsageCard state={state} />
          <ActivityLogPanel logs={[...(state.activeJob?.logs ?? []), ...state.workerLogs]} />
        </div>
      </div>
    </AppShell>
  );
}
