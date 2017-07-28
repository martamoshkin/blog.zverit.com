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
    console.log('SW: SW Broadcasting:', event);
    const data = e.data
    
    if(data.command == "UPDATE_FOUND"){
      console.log("UPDATE_FOUND_BY_SW", data);
      createSnackbar({
        message: "Content updated.",
        actionText:"refresh",
        action: function(e){location.reload()}
      })
    }
  }
}
