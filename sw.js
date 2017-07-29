const CACHE_NAMESPACE = 'main-'

const CACHE = CACHE_NAMESPACE + 'precache-then-runtime';
const PRECACHE_LIST = [
  "./",
  "//fonts.googleapis.com/css?family=Roboto+Slab%3A400%7CArimo%3A400%2C400italic%2C700%2C700italic%7CArimo%3A400%2C700%7CRoboto+Slab%3A400&subset=latin%2Ccyrillic&ver=4.7.4",
  "fonts/fontawesome-webfont.woff2",
  "/js/embed.js",
  "assets/copyscape-seal-white-120x100.png",
  "//fonts.gstatic.com/s/robotoslab/v6/y7lebkjgREBJK96VQi37ZjUj_cnvWIuuBMVgbX098Mw.woff2",
  "//fonts.gstatic.com/s/robotoslab/v6/y7lebkjgREBJK96VQi37Zo4P5ICox8Kq3LLUNMylGO4.woff2",
  "//fonts.gstatic.com/s/arimo/v9/4NN7UQ_VsRBn7NDD9HKUPw.woff2",
  "//c.disquscdn.com/next/embed/styles/lounge.eceee602870fc4ed49dc5f89e270689e.css",
  "//c.disquscdn.com/next/embed/common.bundle.30c6b83b25e15ac64816c512ae56d158.js",
  "//c.disquscdn.com/next/embed/lounge.bundle.aafec1a2f3fa1e486216be04908b0e3a.js",
  "//disqus.com/next/config.js",
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