// Simple health endpoint for docker-compose / monitoring.
export async function GET() {
  return Response.json({ ok: true, ts: new Date().toISOString() });
}
