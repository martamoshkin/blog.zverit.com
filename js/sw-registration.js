function handleRegistration(registration){
  registration.onupdatefound = (e) => {
    const installingWorker = registration.installing;
    installingWorker.onstatechange = (e) => {
      if (installingWorker.state !== 'installed') return;
    };
  }
}

if(navigator.serviceWorker){
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => handleRegistration(registration))
    .catch((error) => {console.log('ServiceWorker registration failed: ', error)})

  navigator.serviceWorker.onmessage = (e) => {
    const data = e.data
    
    if(data.command == "UPDATE_FOUND"){
    }
  }
}
