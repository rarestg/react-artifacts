export const sampleInput = `{"id": "evt_0001", "metadata": {"createdAt": "2024-10-01T12:04:21Z", "source": "ingest"}, "parts": [{"type": "text", "content": "This is a long string value that should be truncated in preview for readability."}]}
{"id": "evt_0002", "metadata": {"createdAt": "2024-10-01T12:05:11Z", "source": "sync"}, "parts": [{"type": "image", "content": "https://example.com/assets/screenshots/this-is-a-very-long-url-for-demonstration"}]}
{"id": "evt_0003", "metadata": {"createdAt": "2024-10-01T12:06:44Z", "source": "api"}, "parts": [{"type": "text", "content": "Short"}], "debug": {"tokenCount": 4812, "notes": "Verbose payload for internal audit"}}`;

export const defaultTruncation = 60;
