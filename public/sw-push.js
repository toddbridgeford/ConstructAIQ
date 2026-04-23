self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'ConstructAIQ', body: event.data.text(), url: '/dashboard' };
  }

  const options = {
    body:               data.body,
    icon:               data.icon  || '/icons/icon-192.png',
    badge:              data.badge || '/icons/icon-192.png',
    tag:                data.tag   || 'constructaiq',
    renotify:           true,
    requireInteraction: false,
    data:               { url: data.url || '/dashboard' },
    actions: [
      { action: 'open',    title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('constructaiq') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
