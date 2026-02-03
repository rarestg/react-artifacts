export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return Response.json({
        name: 'react-artifacts',
        ok: true,
      });
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler;
