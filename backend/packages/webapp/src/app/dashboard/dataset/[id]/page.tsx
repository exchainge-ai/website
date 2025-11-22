import { DatasetDetailContent } from "./content";

// For Next.js App Router, dynamic params must be properly handled
export default async function DatasetDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  // In Next.js 15+, params is a Promise, so we need to await it
  const resolvedParams = await props.params;

  // Log for debugging purposes
  console.log(`[DatasetDetailPage] Received params:`, resolvedParams);

  // Simple validation - after resolving the params
  if (!resolvedParams || !resolvedParams.id) {
    console.error("[DatasetDetailPage] Missing or invalid ID in params");
    // Even with missing ID, pass to client component which will handle the error state
    return <DatasetDetailContent params={{ id: undefined }} />;
  }

  // Pass the resolved ID to the client component
  const datasetId = resolvedParams.id;
  console.log(`[DatasetDetailPage] Rendering with ID: ${datasetId}`);
  return <DatasetDetailContent params={{ id: datasetId }} />;
}
