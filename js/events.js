window.onload = function () {
	var siteTitle = document.getElementsByClassName('site-title')[0];
	siteTitle.onclick = logoClick;

	var pageLinkAboutMe = document.getElementsByClassName('page-link about-me')[0];
	pageLinkAboutMe.onclick = pageLinkAboutMeClick;


	var pagination = document.getElementsByClassName('pagination')[0];
	pagination.onclick = paginationClick;

	var related = document.getElementsByClassName('related')[0];
	related.onclick = relatedClick;
	
	var share = document.getElementsByClassName('share-buttons')[0];
	share.onclick = shareClick;
	
	function logoClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'Logo'});
	}

	function pageLinkAboutMeClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'AboutMePageLink'});
	}

	function paginationClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'Pagination'});
	}
	
	function relatedClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Navigation',
	  'eventAction': 'Click',
	  'eventLabel': 'Related'});
	}
	
	function shareClick() {
		ga('send', {
	  'hitType': 'event',
	  'eventCategory': 'Share',
	  'eventAction': 'Click',
	  'eventLabel': 'Share Buttons'});
	}
}
