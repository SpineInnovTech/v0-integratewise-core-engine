import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// Verify Discord signature using Ed25519
async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const message = encoder.encode(timestamp + body)
    const signatureBuffer = hexToBuffer(signature)
    const publicKeyBuffer = hexToBuffer(publicKey)

    const key = await crypto.subtle.importKey(
      "raw",
      publicKeyBuffer,
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"],
    )

    return await crypto.subtle.verify("Ed25519", key, signatureBuffer, message)
  } catch {
    return false
  }
}

function hexToBuffer(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g) || []
  return new Uint8Array(matches.map((byte) => Number.parseInt(byte, 16)))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    const signature = request.headers.get("x-signature-ed25519") || ""
    const timestamp = request.headers.get("x-signature-timestamp") || ""

    // Verify signature if public key is configured
    let signatureValid = true
    if (process.env.DISCORD_PUBLIC_KEY) {
      signatureValid = await verifyDiscordSignature(process.env.DISCORD_PUBLIC_KEY, signature, timestamp, body)

      if (!signatureValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Handle Discord PING (required for webhook verification)
    if (payload.type === 1) {
      return NextResponse.json({ type: 1 })
    }

    const supabase = createServiceClient()

    // Log webhook
    await supabase.from("webhooks").insert({
      provider: "discord",
      event_type: payload.t || `type_${payload.type}`,
      event_id: payload.id,
      payload,
      signature_valid: signatureValid,
    })

    // Process different event types
    switch (payload.t) {
      case "MESSAGE_CREATE":
        if (!payload.d.author?.bot && payload.d.content) {
          await supabase.from("brainstorm_chats").insert({
            source: "discord",
            source_id: payload.d.id,
            title: `Discord: ${payload.d.channel_id}`,
            content: payload.d.content,
            context: {
              channel_id: payload.d.channel_id,
              guild_id: payload.d.guild_id,
              author_id: payload.d.author?.id,
              author_name: payload.d.author?.username,
            },
            participants: [payload.d.author?.username].filter(Boolean),
            message_count: 1,
            status: "active",
          })
        }
        break

      case "INTERACTION_CREATE":
        const interaction = payload.d

        if (interaction.type === 2) {
          await supabase.from("tasks").insert({
            title: `Discord command: /${interaction.data?.name}`,
            description: JSON.stringify(interaction.data?.options || []),
            status: "pending",
            priority: "medium",
            source: "discord",
            metadata: {
              guild_id: interaction.guild_id,
              channel_id: interaction.channel_id,
              user: interaction.member?.user?.username,
              command: interaction.data?.name,
            },
          })
        }

        return NextResponse.json({
          type: 4,
          data: {
            content: `Command received: ${interaction.data?.name || "Unknown"}`,
          },
        })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Discord webhook error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
