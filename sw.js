const CACHE_NAMESPACE = 'main-'

const CACHE = CACHE_NAMESPACE + 'precache-then-runtime';
const PRECACHE_LIST = [
  "./",
  "//fonts.googleapis.com/css?family=Roboto+Slab%3A400%7CArimo%3A400%2C400italic%2C700%2C700italic%7CArimo%3A400%2C700%7CRoboto+Slab%3A400&subset=latin%2Ccyrillic&ver=4.7.4",
  "fonts/fontawesome-webfont.woff2",
  "/js/embed.js",
  "assets/copyscape-seal-white-120x100.png",
  "//blog.zverit.com/assets/react-functional-programming.png",
  "//blogzverit.disqus.com/embed.js",
  "//disqus.com/next/config.js",
  "//c.disquscdn.com/uploads/users/21136/5778/avatar92.jpg?1513880609",
  "//c.disquscdn.com/next/current/embed/lang/ru.js"
  
]
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  "//zverit.com",
  "cdnjs.cloudflare.com"
]
const DEPRECATED_CACHES = ['precache-v1', 'runtime', 'main-precache-v1', 'main-runtime']


// The Util Function to hack URLs of intercepted requests
const getCacheBustingUrl = (req) => {
  var now = Date.now();
  url = new URL(req.url)

  url.protocol = self.location.protocol

  url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
  return url.href
}

const isNavigationReq = (req) => (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept').includes('text/html')))

const endWithExtension = (req) => Boolean(new URL(req.url).pathname.match(/\.\w+$/))

const shouldRedirect = (req) => (isNavigationReq(req) && new URL(req.url).pathname.substr(-1) !== "/" && !endWithExtension(req))

const getRedirectUrl = (req) => {
  url = new URL(req.url)
  url.pathname += "/"
  return url.href
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(PRECACHE_LIST)
        .then(self.skipWaiting())
        .catch(err => console.log(err))
    })
  )
});

self.addEventListener('activate', event => {
  // delete old deprecated caches.
  caches.keys().then(cacheNames => Promise.all(
    cacheNames
      .filter(cacheName => DEPRECATED_CACHES.includes(cacheName))
      .map(cacheName => caches.delete(cacheName))
  ))
  event.waitUntil(self.clients.claim());
});


var fetchHelper = {

  fetchThenCache: function(request){
    const init = { mode: "no-cors", credentials: "omit" } 

    const fetched = fetch(request, init)
    const fetchedCopy = fetched.then(resp => resp.clone());

    Promise.all([fetchedCopy, caches.open(CACHE)])
      .then(([response, cache]) => response.ok && cache.put(request, response))
      .catch(_ => {/* eat any errors */})
    
    return fetched;
  },

  cacheFirst: function(url){
    return caches.match(url) 
      .then(resp => resp || this.fetchThenCache(url))
      .catch(_ => {/* eat any errors */})
  }
}

self.addEventListener('fetch', event => {
  if (HOSTNAME_WHITELIST.indexOf(new URL(event.request.url).hostname) > -1) {

    if (shouldRedirect(event.request)) {
      event.respondWith(Response.redirect(getRedirectUrl(event.request)))
      return;
    }

    if (event.request.url.indexOf('ys.static') > -1){
      event.respondWith(fetchHelper.cacheFirst(event.request.url))
      return;
    }

    const cached = caches.match(event.request);
    const fetched = fetch(getCacheBustingUrl(event.request), { cache: "no-store" });
    const fetchedCopy = fetched.then(resp => resp.clone());

    event.respondWith(
      Promise.race([fetched.catch(_ => cached), cached])
        .then(resp => resp || fetched)
        .catch(_ => caches.match('offline.html'))
    );

    event.waitUntil(
      Promise.all([fetchedCopy, caches.open(CACHE)])
        .then(([response, cache]) => response.ok && cache.put(event.request, response))
        .catch(_ => {/* eat any errors */ })
    );

    if (isNavigationReq(event.request)) {
      event.waitUntil(revalidateContent(cached, fetchedCopy))
    }
  }
});


function sendMessageToAllClients(msg) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(msg)
    })
  })
}

function sendMessageToClientsAsync(msg) {
  setTimeout(() => {
    sendMessageToAllClients(msg)
  }, 1000)
}

function revalidateContent(cachedResp, fetchedResp) {
  return Promise.all([cachedResp, fetchedResp])
    .then(([cached, fetched]) => {
      const cachedVer = cached.headers.get('last-modified')
      const fetchedVer = fetched.headers.get('last-modified')
      if (cachedVer !== fetchedVer) {
        sendMessageToClientsAsync({
          'command': 'UPDATE_FOUND',
          'url': fetched.url
        })
      }
    })
    .catch(err => console.log(err))
}