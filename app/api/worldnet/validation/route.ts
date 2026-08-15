import { recordWorldnetCallback } from "@/lib/worldnet/server"

export async function GET() {
  return new Response("OK", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const result = await recordWorldnetCallback({
    source: "validation",
    fields: formData,
  })

  return new Response(result.ok ? "OK" : result.message, {
    status: result.status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}
