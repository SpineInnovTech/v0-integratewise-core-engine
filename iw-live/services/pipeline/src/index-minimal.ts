export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response(
      JSON.stringify({ status: "ok", service: "pipeline-minimal", ts: Date.now() }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
