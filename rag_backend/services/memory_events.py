import asyncio

# Global event queue for memory update notifications.
# The memory agent pushes events here; the SSE endpoint consumes them.
memory_event_queue: asyncio.Queue = asyncio.Queue()
