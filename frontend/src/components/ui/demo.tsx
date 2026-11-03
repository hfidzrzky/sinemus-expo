import StatusDot from '@/components/ui/status-dot';

export default function StatusDotDemo() {
  return (
    <div className="flex flex-col items-start gap-4 p-8">
      <StatusDot state="BUILDING" showLabel />
      <StatusDot state="READY" showLabel />
      <StatusDot state="ERROR" showLabel />
      <StatusDot state="QUEUED" showLabel />
      <StatusDot tone="active" label="Live" showLabel />
    </div>
  );
}
